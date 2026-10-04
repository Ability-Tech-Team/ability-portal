import { LoaderCircle } from "lucide-react";

type SubmitButtonProps = {
  pending: boolean;
  label: string;
  pendingLabel: string;
};

/** The form's main button; disabled while the request runs. */
export default function SubmitButton({
  pending,
  label,
  pendingLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-at-navy-800 px-6 font-display text-sm font-bold text-white shadow-sm transition-colors hover:bg-at-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 disabled:cursor-wait disabled:bg-at-navy-700 dark:bg-white dark:text-at-navy-900 dark:hover:bg-at-mist dark:focus-visible:outline-at-blue-300 dark:disabled:bg-at-mist"
    >
      {pending ? (
        <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
