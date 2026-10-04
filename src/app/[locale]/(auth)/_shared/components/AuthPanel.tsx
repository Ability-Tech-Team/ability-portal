import type { ReactNode } from "react";

type AuthPanelProps = {
  title: string;
  titleId: string;
  children: ReactNode;
};

/** The white card that holds a sign-in or password form. */
export default function AuthPanel({ title, titleId, children }: AuthPanelProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_60px_-28px_rgb(0_33_68/0.35)] ring-1 ring-at-line/80 ring-inset motion-safe:animate-enter enter-delay-360 sm:p-8 dark:bg-at-navy-800 dark:shadow-black/40 dark:ring-white/10"
    >
      <h2
        id={titleId}
        className="font-display text-2xl font-bold text-at-navy-800 ltr:tracking-[-0.012em] dark:text-white"
      >
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
