import { Config } from "@/constants/config";
import { ApiError } from "@/services/apiClient";
import type { ApiEnvelope } from "@/types/auth";

const API_URL = Config.apiUrl;

export type ListingMediaPayload = {
  id: number;
  listing_id: number;
  rentable_unit_id: number | null;
  media_type: string;
  url: string | null;
  path: string | null;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  is_primary: boolean;
};

export type UploadOptions = {
  uri: string;
  fileName: string;
  mimeType: string;
  altText?: string;
  isPrimary?: boolean;
  rentableUnitId?: number | null;
  token: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

export function uploadListingMedia(listingId: number, options: UploadOptions): Promise<ListingMediaPayload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new ApiError("Upload cancelled.", 0));
        return;
      }

      options.signal.addEventListener(
        "abort",
        () => {
          xhr.abort();
        },
        { once: true },
      );
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      const text = xhr.responseText;
      let parsed: ApiEnvelope<ListingMediaPayload> | null = null;

      try {
        parsed = text ? (JSON.parse(text) as ApiEnvelope<ListingMediaPayload>) : null;
      } catch {
        parsed = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && parsed?.success) {
        resolve(parsed.data);
        return;
      }

      const firstError = parsed?.errors ? Object.values(parsed.errors).flat()[0] : null;
      reject(new ApiError(firstError ?? parsed?.message ?? "Upload failed.", xhr.status, parsed?.errors ?? {}));
    };

    xhr.onerror = () => {
      reject(new ApiError("The upload request failed. Check your network and try again.", 0));
    };

    xhr.onabort = () => {
      reject(new ApiError("Upload cancelled.", 0));
    };

    xhr.ontimeout = () => {
      reject(new ApiError("The upload timed out.", 0));
    };

    xhr.open("POST", `${API_URL}/vendor/listings/${listingId}/media`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${options.token}`);

    const formData = new FormData();
    formData.append("file", {
      uri: options.uri,
      name: options.fileName,
      type: options.mimeType,
    } as unknown as Blob);

    if (options.altText) {
      formData.append("alt_text", options.altText);
    }

    if (options.isPrimary) {
      formData.append("is_primary", "1");
    }

    if (options.rentableUnitId != null) {
      formData.append("rentable_unit_id", String(options.rentableUnitId));
    }

    xhr.send(formData);
  });
}

export async function updateListingMedia(
  listingId: number,
  mediaId: number,
  patch: { is_primary?: boolean; sort_order?: number; alt_text?: string | null },
  token: string,
): Promise<ListingMediaPayload> {
  const response = await fetch(`${API_URL}/vendor/listings/${listingId}/media/${mediaId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  const json = (await response.json().catch(() => null)) as ApiEnvelope<ListingMediaPayload> | null;

  if (!response.ok || !json?.success) {
    const firstError = json?.errors ? Object.values(json.errors).flat()[0] : null;
    throw new ApiError(firstError ?? json?.message ?? "Update failed.", response.status, json?.errors ?? {});
  }

  return json.data;
}

export async function deleteListingMedia(listingId: number, mediaId: number, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/vendor/listings/${listingId}/media/${mediaId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return;
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<null> | null;

  if (!response.ok || !json?.success) {
    const firstError = json?.errors ? Object.values(json.errors).flat()[0] : null;
    throw new ApiError(firstError ?? json?.message ?? "Delete failed.", response.status, json?.errors ?? {});
  }
}
