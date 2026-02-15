import { AuthProvider, AuthSession } from "@/shared/lib/platform/auth-session";

export type LocalAuthAccount = {
  id: string;
  email: string;
  password?: string;
  displayName?: string;
  marketingEmails: boolean;
  provider: AuthProvider;
  createdAt: string;
  updatedAt: string;
};

export type AuthActionResult =
  | { ok: true; session: AuthSession; source: "api" | "local" }
  | { ok: false; message: string };
