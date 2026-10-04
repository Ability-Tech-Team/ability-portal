import { useActionState, useEffect, useRef } from "react";
import { requestPasswordLink } from "../actions";
import type { ForgotPasswordFormState } from "../types";

const initialState: ForgotPasswordFormState = { status: "idle", email: "" };

/**
 * The forgot-password form's state. Focus moves to the field to fix, the
 * error message, or the confirmation, so it is announced.
 */
export function useForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordLink,
    initialState,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "invalid") {
      emailRef.current?.focus();
    } else if (state.status === "failed" || state.status === "sent") {
      messageRef.current?.focus();
    }
  }, [state]);

  return { state, formAction, pending, emailRef, messageRef };
}
