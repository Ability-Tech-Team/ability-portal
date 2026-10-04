"use server";

import { redirect } from "next/navigation";
import { formLocale, formString } from "@/src/lib/formData";
import { getProductDestinations } from "@/src/lib/productDestinations";
import { resolveReturnTo } from "@/src/lib/returnTo";
import { getEndUserIp, startSession } from "@/src/lib/session";
import { signIn as signInWithPassword } from "@/src/services/accountService";
import { toRetryMinutes } from "../_shared/validation";
import { validateSignInFields } from "./schema";
import type { SignInFormState } from "./types";

/**
 * Signs the client in with the account service, stores the session cookie,
 * and opens the product they came from (only a configured product address)
 * or the Portal home. A public endpoint: the account service rate-limits
 * attempts per account and per IP address.
 */
export async function signIn(
  _previous: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const locale = formLocale(formData);
  const email = formString(formData, "email").trim();
  const password = formString(formData, "password");
  const fieldErrors = validateSignInFields({ email, password });

  if (fieldErrors.email || fieldErrors.password) {
    return { status: "invalid", email, fieldErrors };
  }

  const result = await signInWithPassword({
    email,
    password,
    endUserIp: await getEndUserIp(),
  });

  if (!result.ok) {
    return {
      status: "failed",
      email,
      error: result.reason,
      retryAfterMinutes:
        result.reason === "too_many_attempts"
          ? toRetryMinutes(result.retryAfterSeconds)
          : null,
    };
  }

  await startSession(result.session);

  const returnTarget = resolveReturnTo(
    formString(formData, "returnTo"),
    getProductDestinations(),
  );

  redirect(returnTarget?.url ?? `/${locale}`);
}
