import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode, Ref } from "react";

type FormAlertProps = {
  tone: "error" | "success";
  children: ReactNode;
  /** Forms move focus here after a failed submission. */
  ref?: Ref<HTMLDivElement>;
};

const toneClassNames = {
  error:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/10 dark:text-red-100 dark:ring-red-400/30",
  success:
    "bg-at-mist text-at-navy-800 ring-at-line dark:bg-white/5 dark:text-white dark:ring-white/10",
};

const iconClassNames = {
  error: "text-red-700 dark:text-red-300",
  success: "text-at-teal-700 dark:text-at-cyan-500",
};

/** A message above a form: an error, or a confirmation such as "signed out". */
export default function FormAlert({ tone, children, ref }: FormAlertProps) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl p-4 text-sm leading-relaxed ring-1 ring-inset outline-none ${toneClassNames[tone]}`}
    >
      <Icon
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 ${iconClassNames[tone]}`}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
