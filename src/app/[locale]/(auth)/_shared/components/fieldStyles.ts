/** Shared classes for the sign-in and password form fields. */

export const labelClassName =
  "block text-sm font-semibold text-at-navy-800 dark:text-white";

export const hintClassName =
  "mt-1 text-sm leading-relaxed text-at-ink-muted dark:text-white/65";

export const inputClassName = [
  "block h-12 w-full rounded-xl border border-at-line bg-white px-4 text-base text-at-ink shadow-xs outline-none",
  "transition-[border-color,box-shadow] duration-200",
  "focus:border-at-blue-500 focus:ring-4 focus:ring-at-blue-500/15",
  "aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15",
  "dark:border-white/15 dark:bg-at-navy-900 dark:text-white dark:focus:border-at-blue-300 dark:focus:ring-at-blue-300/20 dark:aria-invalid:border-red-400",
].join(" ");

export const errorClassName =
  "mt-2 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300";
