import { Config } from "@/constants/config";
import type { ApiEnvelope } from "@/types/auth";

const API_URL = Config.apiUrl;
const REQUEST_TIMEOUT_MS = 15000;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  skipAuthRefresh?: boolean;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export type AuthHandlers = {
  getToken: () => string | null;
  setToken: (token: string) => Promise<void>;
  onUnauthorized: () => Promise<void>;
};

let authHandlers: AuthHandlers | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClient(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export function clearApiClientHandlers(): void {
  authHandlers = null;
  refreshInFlight = null;
}

async function rawFetch(path: string, options: RequestOptions, tokenOverride?: string | null) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenOverride !== undefined ? tokenOverride : options.token;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const composedSignal = options.signal
    ? composeSignals(controller.signal, options.signal)
    : controller.signal;

  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: composedSignal,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    const detail = timedOut ? "The request timed out." : "The network request failed.";

    throw new ApiError(
      `${detail} Cannot connect to API at ${API_URL}. Make sure Laravel is reachable from this device.`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function composeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) {
    return a;
  }

  if (b.aborted) {
    return b;
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();

  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });

  return controller.signal;
}

async function refreshAccessToken(currentToken: string): Promise<string | null> {
  if (!authHandlers) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await rawFetch(
          "/token/refresh",
          { method: "POST", skipAuthRefresh: true },
          currentToken,
        );

        const json = (await response.json().catch(() => null)) as
          | ApiEnvelope<{ access_token?: string } & Record<string, unknown>>
          | null;

        if (!response.ok || !json?.success) {
          await authHandlers?.onUnauthorized();
          return null;
        }

        const nextToken = (json.data as { access_token?: string } | undefined)?.access_token ?? null;

        if (nextToken && authHandlers) {
          await authHandlers.setToken(nextToken);
          return nextToken;
        }

        await authHandlers?.onUnauthorized();
        return null;
      } catch {
        await authHandlers?.onUnauthorized();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    const firstError = json?.errors ? Object.values(json.errors).flat()[0] : null;

    throw new ApiError(
      firstError ?? json?.message ?? "Request failed.",
      response.status,
      json?.errors ?? {},
    );
  }

  return json.data;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const explicitToken = options.token;
  const initialToken =
    explicitToken !== undefined ? explicitToken : authHandlers?.getToken() ?? null;

  let response = await rawFetch(path, options, initialToken);

  const canRefresh =
    response.status === 401 &&
    !!initialToken &&
    options.skipAuthRefresh !== true &&
    !!authHandlers &&
    path !== "/token/refresh";

  if (canRefresh) {
    const nextToken = await refreshAccessToken(initialToken);

    if (nextToken) {
      response = await rawFetch(path, options, nextToken);
    }
  }

  return parseEnvelope<T>(response);
}
