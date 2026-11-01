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
async function submitSignIn(
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

  return completeSignIn({
    email,
    answer: result.answer,
    returnTo: formString(formData, "returnTo") || null,
    locale: formLocale(formData),
  });
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
