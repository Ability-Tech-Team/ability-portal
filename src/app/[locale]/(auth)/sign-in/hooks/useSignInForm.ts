import { unstable_rethrow } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { formLocale, formString } from "@/src/lib/formData";
import { getPortalApiUrl } from "@/src/lib/portalApi";
import { signIn } from "@/src/services/portalAuth";
import { toRetryMinutes } from "../../_shared/validation";
import { completeSignIn } from "../actions";
import { validateSignInFields } from "../schema";
import type { SignInFormState } from "../types";

const initialState: SignInFormState = { status: "idle", email: "" };

/**
 * Signs in with the portal backend from the browser, so the browser receives
 * the backend's session cookie, then has the Portal's server store the answer
 * for the products and open the next page.
 */
export async function submitSignIn(
  _previous: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = formString(formData, "email").trim();
  const password = formString(formData, "password");
  const fieldErrors = validateSignInFields({ email, password });

  if (fieldErrors.email || fieldErrors.password) {
    return { status: "invalid", email, fieldErrors };
  }

  const baseUrl = getPortalApiUrl();
  const result = baseUrl
    ? await signIn(baseUrl, { email, password })
    : ({ ok: false, reason: "unavailable" } as const);

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

  try {
    return await completeSignIn({
      email,
      answer: result.answer,
      returnTo: formString(formData, "returnTo") || null,
      locale: formLocale(formData),
    });
  } catch (error) {
    // Opening the next page rejects with Next.js's redirect; let it through.
    unstable_rethrow(error);
    // The Portal's server didn't store the session, e.g. a proxy in front of
    // it refused the request: say so on the form, not on an error page.
    return {
      status: "failed",
      email,
      error: "unavailable",
      retryAfterMinutes: null,
    };
  }
}

/**
 * The sign-in form's state. After a failed attempt, focus moves to the first
 * field to fix, or to the error message, so keyboard and screen reader users
 * land on it.
 */
export function useSignInForm() {
  const [state, formAction, pending] = useActionState(
    submitSignIn,
    initialState,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "invalid") {
      (state.fieldErrors.email ? emailRef : passwordRef).current?.focus();
    } else if (state.status === "failed") {
      alertRef.current?.focus();
    }
  }, [state]);

  return { state, formAction, pending, emailRef, passwordRef, alertRef };
}
