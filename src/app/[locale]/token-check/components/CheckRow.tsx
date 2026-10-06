import { CircleAlert, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type CheckRowProps = {
  title: string;
  description: string;
  tone: "pass" | "fail" | "warn" | "running";
  result: string;
  children?: ReactNode;
};

const tones = {
  pass: {
    Icon: CircleCheck,
    label: "Pass",
    className: "text-at-teal-700 dark:text-at-cyan-500",
  },
  fail: {
    Icon: CircleX,
    label: "Fail",
    className: "text-red-700 dark:text-red-300",
  },
  warn: {
    Icon: CircleAlert,
    label: "Check",
    className: "text-amber-700 dark:text-amber-300",
  },
  running: {
    Icon: LoaderCircle,
    label: "Running",
    className: "text-at-ink-muted dark:text-white/70",
  },
};

/** One check on the token-check page and its outcome. */
export default function CheckRow({
  title,
  description,
  tone,
  result,
  children,
}: CheckRowProps) {
  const { Icon, label, className } = tones[tone];

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-at-line ring-inset dark:bg-at-navy-800 dark:ring-white/10">
      <h2 className="font-display text-lg font-bold text-at-navy-800 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-at-ink-muted dark:text-white/70">
        {description}
      </p>
      <p
        role="status"
        className={`mt-4 flex items-start gap-2 text-sm font-semibold ${className}`}
      >
        <Icon
          aria-hidden
          className={`mt-0.5 size-4 shrink-0 ${tone === "running" ? "motion-safe:animate-spin" : ""}`}
        />
        <span>
          {label}: <span className="font-normal">{result}</span>
        </span>
      </p>
      {children}
    </section>
  );
}
