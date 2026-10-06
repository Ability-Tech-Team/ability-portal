"use server";

import { redirect } from "next/navigation";
import { formLocale, formString } from "@/src/lib/formData";
import { toReturnDestinations } from "@/src/lib/portalSession";
import { resolveReturnTo } from "@/src/lib/returnTo";
import { getEndUserIp, startSession } from "@/src/lib/session";
import { logIn } from "@/src/services/portalApi";
import { toRetryMinutes } from "../_shared/validation";
import { parseClientCode, parseProjectId, validateSignInFields } from "./schema";
import type { SignInFormState } from "./types";

/**
 * Signs the client in with the Portal API. When the email belongs to several
 * clients, or the account to several projects, it returns the choices, and
 * the form posts again with the credentials and the choice. On success it
 * stores the session cookies and opens the product the client came from
 * (only one of their own platform addresses) or the Portal home. A public
 * endpoint: the Portal API rate-limits attempts per IP address.
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

  const result = await logIn({
    email,
    password,
    clientCode: parseClientCode(formString(formData, "clientCode")),
    projectId: parseProjectId(formString(formData, "projectId")),
    locale,
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

  if (result.step === "chooseClient") {
    return { status: "choose-client", email, clients: result.clients };
  }

  if (result.step === "chooseProject") {
    return {
      status: "choose-project",
      email,
      client: result.client,
      projects: result.projects,
    };
  }

  await startSession({
    token: result.token,
    expiresAt: result.expiresAt,
    account: result.account,
    platforms: result.platforms,
  });

  const returnTarget = resolveReturnTo(
    formString(formData, "returnTo"),
    toReturnDestinations(result.platforms),
  );

  redirect(returnTarget?.url ?? `/${locale}`);
}
