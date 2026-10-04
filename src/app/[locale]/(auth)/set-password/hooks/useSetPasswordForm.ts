import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { setNewPassword } from "../actions";
import type { SetPasswordFormState } from "../types";
import { readTokenFromHash } from "../utils";

const initialState: SetPasswordFormState = { status: "idle" };

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * The set-password form's state and the link token. The token lives in the
 * URL fragment, which only the browser can read: it is `undefined` during
 * server rendering and hydration, then the token or null.
 */
export function useSetPasswordForm() {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => null,
  );
  const token = hash === null ? undefined : readTokenFromHash(hash);
  const [state, formAction, pending] = useActionState(
    setNewPassword,
    initialState,
  );
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "invalid") {
      (state.fieldErrors.password ? passwordRef : confirmRef).current?.focus();
    } else if (state.status === "failed") {
      alertRef.current?.focus();
    }
  }, [state]);

  return {
    token,
    state,
    formAction,
    pending,
    passwordRef,
    confirmRef,
    alertRef,
  };
}
