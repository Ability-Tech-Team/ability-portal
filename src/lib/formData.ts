import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/src/i18n/routing";

/** A text field of a submitted form; files and missing fields read as "". */
export function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * The page locale a form posts in a hidden `locale` field. Server Actions
 * can't read the `[locale]` route parameter, so forms send it; anything
 * unknown falls back to the default locale.
 */
export function formLocale(formData: FormData): AppLocale {
  const value = formString(formData, "locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
