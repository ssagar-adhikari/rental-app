export type UserRole = "admin" | "vendor" | "customer";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  status: boolean;
  roles: UserRole[];
  permissions: string[];
  two_factor_enabled: boolean;
  last_login_at: string | null;
};

export type AuthPayload = {
  token_type: "bearer";
  access_token: string;
  expires_in: number;
  user: AuthUser;
};

export type LoginResponse =
  | ({
      requires_two_factor: false;
    } & AuthPayload)
  | {
      requires_two_factor: true;
      challenge_token: string;
      expires_in: number;
      message: string;
    };

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
};
