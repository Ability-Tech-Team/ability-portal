"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import FormAlert from "../../_shared/components/FormAlert";
import PasswordField from "../../_shared/components/PasswordField";
import SubmitButton from "../../_shared/components/SubmitButton";
import { NEW_PASSWORD_MIN_LENGTH } from "../../_shared/validation";
import { useSetPasswordForm } from "../hooks/useSetPasswordForm";

type SetPasswordFormProps = {
  locale: string;
};

const secondaryButtonClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-full px-6 font-display text-sm font-bold text-at-navy-800 ring-1 ring-at-line ring-inset transition-colors hover:bg-at-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:text-white dark:ring-white/20 dark:hover:bg-white/10 dark:focus-visible:outline-at-blue-300";

export default function SetPasswordForm({ locale }: SetPasswordFormProps) {
  const t = useTranslations("SetPassword");
  const tAuth = useTranslations("Auth");
  const {
    token,
    state,
    formAction,
    pending,
    passwordRef,
    confirmRef,
    alertRef,
  } = useSetPasswordForm();

  if (token === undefined) {
    return (
      <p role="status" className="text-sm text-at-ink-muted dark:text-white/70">
        {t("checkingLink")}
      </p>
    );
  }

  if (
    token === null ||
    (state.status === "failed" && state.error === "token_invalid")
  ) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert ref={alertRef} tone="error">
          {t(token === null ? "linkMissing" : "linkInvalid")}
        </FormAlert>
        <Link href="/forgot-password" className={secondaryButtonClassName}>
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  const invalid = state.status === "invalid" ? state : null;
  const passwordError = invalid?.fieldErrors.password;
  const confirmError = invalid?.fieldErrors.confirmPassword;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />

      {state.status === "failed" ? (
        <FormAlert ref={alertRef} tone="error">
          {state.error === "too_many_attempts"
            ? state.retryAfterMinutes === null
              ? tAuth("tooManyAttemptsLater")
              : tAuth("tooManyAttempts", { minutes: state.retryAfterMinutes })
            : tAuth("unavailable")}
        </FormAlert>
      ) : null}

      <PasswordField
        ref={passwordRef}
        id="new-password"
        name="password"
        autoComplete="new-password"
        required
        label={t("newPassword")}
        hint={t("hint", { minLength: NEW_PASSWORD_MIN_LENGTH })}
        showLabel={tAuth("showPassword")}
        error={
          invalid && passwordError
            ? t(`errors.${passwordError}`, {
                minLength: invalid.minLength,
                maxLength: invalid.maxLength,
              })
            : undefined
        }
      />

      <PasswordField
        ref={confirmRef}
        id="confirm-password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        label={t("confirmPassword")}
        showLabel={tAuth("showPassword")}
        error={confirmError ? t(`errors.${confirmError}`) : undefined}
      />

      <SubmitButton
        pending={pending}
        label={t("submit")}
        pendingLabel={t("submitting")}
      />
    </form>
  );
}
