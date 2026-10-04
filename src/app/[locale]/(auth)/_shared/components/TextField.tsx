import { CircleAlert } from "lucide-react";
import type { InputHTMLAttributes, Ref } from "react";
import {
  errorClassName,
  hintClassName,
  inputClassName,
  labelClassName,
} from "./fieldStyles";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "aria-invalid" | "aria-describedby"
> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

/** A labeled input with an optional hint and an error tied to it. */
export default function TextField({
  id,
  label,
  hint,
  error,
  ref,
  className = "",
  ...inputProps
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

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
      <input
        {...inputProps}
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-2 ${inputClassName} ${className}`}
      />
      {error ? (
        <p id={errorId} className={errorClassName}>
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
