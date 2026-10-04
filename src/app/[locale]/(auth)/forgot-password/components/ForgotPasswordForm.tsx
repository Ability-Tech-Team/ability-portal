"use client";

import { useTranslations } from "next-intl";
import FormAlert from "../../_shared/components/FormAlert";
import SubmitButton from "../../_shared/components/SubmitButton";
import TextField from "../../_shared/components/TextField";
import { EMAIL_MAX_LENGTH } from "../../_shared/validation";
import { useForgotPasswordForm } from "../hooks/useForgotPasswordForm";

type ForgotPasswordFormProps = {
  locale: string;
};

export default function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("ForgotPassword");
  const tAuth = useTranslations("Auth");
  const { state, formAction, pending, emailRef, messageRef } =
    useForgotPasswordForm();

  if (state.status === "sent") {
    return (
      <FormAlert ref={messageRef} tone="success">
        <p className="font-semibold">{t("sentTitle")}</p>
        <p className="mt-1">
          {t.rich("sentDescription", {
            address: state.email,
            email: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
          })}
        </p>
      </FormAlert>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />

      {state.status === "failed" ? (
        <FormAlert ref={messageRef} tone="error">
          {state.error === "unavailable"
            ? tAuth("unavailable")
            : state.retryAfterMinutes === null
              ? tAuth("tooManyAttemptsLater")
              : tAuth("tooManyAttempts", { minutes: state.retryAfterMinutes })}
        </FormAlert>
      ) : null}

      <TextField
        ref={emailRef}
        id="forgot-password-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        dir="ltr"
        required
        maxLength={EMAIL_MAX_LENGTH}
        defaultValue={state.email}
        label={tAuth("email")}
        hint={t("emailHint")}
        error={
          state.status === "invalid"
            ? tAuth(`errors.${state.emailError}`)
            : undefined
        }
        className="rtl:text-right"
      />

      <SubmitButton
        pending={pending}
        label={t("submit")}
        pendingLabel={t("submitting")}
      />
    </form>
  );
}
