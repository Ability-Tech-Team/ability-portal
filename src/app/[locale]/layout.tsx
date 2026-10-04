import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Cairo, Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { getLocaleDirection, routing } from "@/src/i18n/routing";
import "../globals.css";

// The Ability Tech brand fonts, downloaded at build time and served by the
// Portal itself. globals.css picks the stacks per language: Montserrat
// headings and Inter text in English, Cairo in Arabic.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  // The header backgrounds: white, and Ability Tech navy-900 in dark mode.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#00153c" },
  ],
  colorScheme: "light dark",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      className={`${montserrat.variable} ${inter.variable} ${cairo.variable}`}
    >
      <body className="min-h-dvh bg-at-wash text-at-ink antialiased selection:bg-at-cyan-500/30 dark:bg-at-navy-900 dark:text-white">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
