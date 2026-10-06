import { useActionState, useEffect, useRef } from "react";
import { signIn } from "../actions";
import type { SignInFormState } from "../types";

const initialState: SignInFormState = { status: "idle", email: "" };

type Credentials = { email: string; password: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isChoosing(
  state: SignInFormState,
): state is Extract<
  SignInFormState,
  { status: "choose-client" | "choose-project" }
> {
  return state.status === "choose-client" || state.status === "choose-project";
}

/**
 * The sign-in form's state. When the Portal API asks for a client or a
 * project, the credentials typed in the first step are sent again with the
 * choice; they are kept in memory only, never in the action's state. After a
 * failed attempt, focus moves to the first field to fix, the error message,
 * or the choice, so keyboard and screen reader users land on it.
 */
export function useSignInForm() {
  const credentials = useRef<Credentials | null>(null);
  const [state, formAction, pending] = useActionState(
    async (
      previous: SignInFormState,
      formData: FormData,
    ): Promise<SignInFormState> => {
      if (isChoosing(previous)) {
        if (formData.get("intent") === "restart" || !credentials.current) {
          credentials.current = null;
          return { status: "idle", email: previous.email };
        }

        const choiceField =
          previous.status === "choose-client" ? "clientCode" : "projectId";

        if (!field(formData, choiceField)) {
          return { ...previous, choiceMissing: true };
        }

        formData.set("email", credentials.current.email);
        formData.set("password", credentials.current.password);

        if (previous.status === "choose-project") {
          formData.set("clientCode", previous.client.code);
        }
      } else {
        credentials.current = {
          email: field(formData, "email"),
          password: field(formData, "password"),
        };
      }

      const next = await signIn(previous, formData);

      if (!isChoosing(next)) {
        credentials.current = null;
      }

      return next;
    },
    initialState,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const choiceRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (state.status === "invalid") {
      (state.fieldErrors.email ? emailRef : passwordRef).current?.focus();
    } else if (state.status === "failed") {
      alertRef.current?.focus();
    } else if (isChoosing(state)) {
      choiceRef.current?.focus();
    }
  }, [state]);

  return {
    state,
    formAction,
    pending,
    emailRef,
    passwordRef,
    alertRef,
    choiceRef,
  };
}
