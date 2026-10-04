import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import BrandLogo from "./BrandLogo";
import HeroBackdrop from "./HeroBackdrop";

type PortalShellProps = {
  /** The end of the header, such as sign-out and the language switch. */
  headerActions: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
  titleId: string;
  intro?: ReactNode;
  /** Shown under the intro, inside the hero band. */
  heroFooter?: ReactNode;
  /** Centers the hero text above narrow content such as a form. */
  centered?: boolean;
  /** The page content; it overlaps the bottom of the hero band. */
  children: ReactNode;
};

/**
 * The Portal page frame: the header with the logo, the navy hero band, the
 * content that overlaps it, and the footer.
 */
export default function PortalShell({
  headerActions,
  eyebrow,
  title,
  titleId,
  intro,
  heroFooter,
  centered = false,
  children,
}: PortalShellProps) {
  const t = useTranslations("Shell");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-20 border-b border-at-line-soft bg-white motion-safe:animate-enter dark:border-white/10 dark:bg-at-navy-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="flex items-center gap-3">
            <BrandLogo height={44} className="shrink-0" />
            <span aria-hidden className="h-8 w-px bg-at-line dark:bg-white/15" />
            <span className="font-display text-lg font-bold text-at-navy-800 dark:text-white">
              {t("portal")}
            </span>
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            {headerActions}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden pt-14 pb-36 text-white sm:pt-20 sm:pb-44">
          <HeroBackdrop />
          <div
            className={`mx-auto max-w-6xl px-4 sm:px-6 ${centered ? "text-center" : ""}`}
          >
            <p
              className={`flex items-center gap-3 text-xs font-bold text-at-teal-500 uppercase motion-safe:animate-enter enter-delay-80 ltr:tracking-[0.18em] sm:text-sm ${centered ? "justify-center" : ""}`}
            >
              <span
                aria-hidden
                className="h-0.5 w-8 shrink-0 rounded-full bg-(image:--at-grad-accent)"
              />
              {eyebrow}
            </p>
            <h1
              id={titleId}
              className={`mt-5 max-w-3xl font-display text-4xl leading-[1.12] font-extrabold text-balance motion-safe:animate-enter enter-delay-160 ltr:tracking-[-0.022em] rtl:leading-[1.42] sm:text-6xl ${centered ? "mx-auto" : ""}`}
            >
              {title}
            </h1>
            {intro ? (
              <p
                className={`mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-white/75 motion-safe:animate-enter enter-delay-240 rtl:leading-[1.85] ${centered ? "mx-auto" : ""}`}
              >
                {intro}
              </p>
            ) : null}
            {heroFooter ? (
              <div className="mt-8 motion-safe:animate-enter enter-delay-300">
                {heroFooter}
              </div>
            ) : null}
          </div>
        </section>

        {/* The content overlaps the bottom of the hero band. */}
        <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-4 pb-20 sm:-mt-28 sm:px-6">
          {children}
        </div>
      </main>

      <footer className="bg-at-navy-900 text-white">
        <div aria-hidden className="h-px bg-(image:--at-grad-rule)" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <BrandLogo height={40} tone="white" />
          <p className="text-sm text-white/70">{t("footer")}</p>
        </div>
      </footer>
    </div>
  );
}
