import type { AuthError } from "@supabase/supabase-js";

type TranslateFn = (key: string) => string;

export function getAuthErrorMessage(error: unknown, t: TranslateFn): string {
  if (!error || typeof error !== "object") {
    return t("authGenericError");
  }

  const authError = error as AuthError;
  const message = authError.message?.toLowerCase() ?? "";

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return t("authInvalidCredentials");
  }

  if (message.includes("user already registered") || message.includes("already been registered")) {
    return t("authEmailAlreadyRegistered");
  }

  if (message.includes("password should be at least")) {
    return t("authWeakPassword");
  }

  if (message.includes("unable to validate email")) {
    return t("authInvalidEmail");
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("wrong password")
  ) {
    return t("authInvalidCredentials");
  }

  const i18nKey = (error as { i18nKey?: string }).i18nKey;
  if (i18nKey) {
    return t(i18nKey);
  }

  return authError.message || t("authGenericError");
}
