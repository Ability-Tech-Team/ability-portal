"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

type SignOutButtonProps = {
  label: string;
  pendingLabel: string;
};

/**
 * The submit button of the sign-out form. Small screens show only the icon;
 * the label stays available to screen readers.
 */
export default function SignOutButton({
  label,
  pendingLabel,
}: SignOutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-at-navy-800 ring-1 ring-at-line ring-inset transition-colors hover:bg-at-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 disabled:cursor-wait dark:text-white/85 dark:ring-white/15 dark:hover:bg-white/10 dark:focus-visible:outline-at-blue-300"
    >
      {pending ? (
        <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
      ) : (
        <LogOut aria-hidden className="size-4 rtl:-scale-x-100" />
      )}
      <span className="max-sm:sr-only">{pending ? pendingLabel : label}</span>
    </button>
  );
}
