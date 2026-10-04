"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import FormAlert from "../../_shared/components/FormAlert";
import PasswordField from "../../_shared/components/PasswordField";
import SubmitButton from "../../_shared/components/SubmitButton";
import TextField from "../../_shared/components/TextField";
import { EMAIL_MAX_LENGTH } from "../../_shared/validation";
import { useSignInForm } from "../hooks/useSignInForm";
import type { SignInFormState, SignInNotice } from "../types";

type SignInFormProps = {
  locale: string;
  /** A validated product address to open after signing in. */
  returnTo: string | null;
  notice: SignInNotice | null;
};

export default function SignInForm({
  locale,
  returnTo,
  notice,
}: SignInFormProps) {
  const t = useTranslations("SignIn");
  const tAuth = useTranslations("Auth");
  const { state, formAction, pending, emailRef, passwordRef, alertRef } =
    useSignInForm();
  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};

  function failureMessage(
    failure: Extract<SignInFormState, { status: "failed" }>,
  ) {
    switch (failure.error) {
      case "invalid_credentials":
        return t("invalidCredentials");
      case "account_disabled":
        return t("accountDisabled");
      case "too_many_attempts":
        return failure.retryAfterMinutes === null
          ? tAuth("tooManyAttemptsLater")
          : tAuth("tooManyAttempts", { minutes: failure.retryAfterMinutes });
      case "unavailable":
        return tAuth("unavailable");
    }
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      {state.status === "failed" ? (
        <FormAlert ref={alertRef} tone="error">
          {failureMessage(state)}
        </FormAlert>
      ) : notice && state.status === "idle" ? (
        <FormAlert tone="success">{t(`notices.${notice}`)}</FormAlert>
      ) : null}

      <TextField
        ref={emailRef}
        id="sign-in-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        dir="ltr"
        required
        maxLength={EMAIL_MAX_LENGTH}
        defaultValue={state.email}
        label={tAuth("email")}
        error={
          fieldErrors.email ? tAuth(`errors.${fieldErrors.email}`) : undefined
        }
        className="rtl:text-right"
      />

      <PasswordField
        ref={passwordRef}
        id="sign-in-password"
        name="password"
        autoComplete="current-password"
        required
        label={tAuth("password")}
        showLabel={tAuth("showPassword")}
        error={
          fieldErrors.password
            ? tAuth(`errors.${fieldErrors.password}`)
            : undefined
        }
        after={
          <p className="mt-2 text-end">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-at-blue-500 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:text-at-blue-300"
            >
              {t("forgotPassword")}
            </Link>
          </p>
        }
      />

      <SubmitButton
        pending={pending}
        label={t("submit")}
        pendingLabel={t("submitting")}
      />
    </form>
  );
}
