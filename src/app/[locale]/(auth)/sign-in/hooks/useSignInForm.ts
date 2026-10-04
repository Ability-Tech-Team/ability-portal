import { useActionState, useEffect, useRef } from "react";
import { signIn } from "../actions";
import type { SignInFormState } from "../types";

const initialState: SignInFormState = { status: "idle", email: "" };

/**
 * The sign-in form's state. After a failed attempt, focus moves to the first
 * field to fix, or to the error message, so keyboard and screen reader users
 * land on it.
 */
export function useSignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
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
