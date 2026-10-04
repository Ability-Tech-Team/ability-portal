"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode, type Ref } from "react";
import {
  errorClassName,
  hintClassName,
  inputClassName,
  labelClassName,
} from "./fieldStyles";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  /** The accessible name of the show/hide button; its pressed state tells
   * whether the password is visible. */
  showLabel: string;
  hint?: string;
  error?: string;
  /** Shown after the field, such as a "Forgot your password?" link. */
  after?: ReactNode;
  required?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/**
 * A password input with a button that shows or hides the typed text. The
 * field stays in the page's direction, so the button sits at its end in both
 * languages.
 */
export default function PasswordField({
  id,
  name,
  label,
  autoComplete,
  showLabel,
  hint,
  error,
  after,
  required,
  ref,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");
  const Icon = visible ? EyeOff : Eye;

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {hint ? (
        <p id={hintId} className={hintClassName}>
          {hint}
        </p>
      ) : null}
      <div className="relative mt-2">
        <input
          id={id}
          ref={ref}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClassName} pe-12`}
        />
        <button
          type="button"
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-xl text-at-ink-muted transition-colors hover:text-at-navy-800 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-at-blue-500 dark:text-white/60 dark:hover:text-white dark:focus-visible:outline-at-blue-300"
        >
          <Icon aria-hidden className="size-5" />
          <span className="sr-only">{showLabel}</span>
        </button>
      </div>
      {error ? (
        <p id={errorId} className={errorClassName}>
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {after}
    </div>
  );
}
