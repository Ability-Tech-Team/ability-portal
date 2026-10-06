import { CircleAlert } from "lucide-react";
import type { Ref } from "react";
import {
  errorClassName,
  hintClassName,
  labelClassName,
} from "../../_shared/components/fieldStyles";

type SignInChoiceProps = {
  /** The form moves focus here when the choice appears or is missing. */
  ref?: Ref<HTMLFieldSetElement>;
  id: string;
  name: "clientCode" | "projectId";
  legend: string;
  hint: string;
  error?: string;
  options: { value: string; label: string }[];
};

/** One radio button per client or project the sign-in can continue with. */
export default function SignInChoice({
  ref,
  id,
  name,
  legend,
  hint,
  error,
  options,
}: SignInChoiceProps) {
  const hintId = `${id}-hint`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      ref={ref}
      tabIndex={-1}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ")}
      aria-invalid={error ? true : undefined}
      className="outline-none"
    >
      <legend className={labelClassName}>{legend}</legend>
      <p id={hintId} className={hintClassName}>
        {hint}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-at-line bg-white px-4 py-3 text-base text-at-ink transition-[border-color,box-shadow] duration-200 has-checked:border-at-blue-500 has-checked:ring-4 has-checked:ring-at-blue-500/15 has-focus-visible:border-at-blue-500 has-focus-visible:ring-4 has-focus-visible:ring-at-blue-500/15 dark:border-white/15 dark:bg-at-navy-900 dark:text-white dark:has-checked:border-at-blue-300 dark:has-checked:ring-at-blue-300/20 dark:has-focus-visible:border-at-blue-300"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              className="size-4 shrink-0 accent-at-blue-500 outline-none dark:accent-at-blue-300"
            />
            <bdi className="min-w-0">{option.label}</bdi>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className={errorClassName}>
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}
