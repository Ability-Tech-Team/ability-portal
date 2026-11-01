"use server";

import { hasLocale } from "next-intl";
import { redirect } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import { getProductDestinations } from "@/src/lib/productDestinations";
import { resolveReturnTo } from "@/src/lib/returnTo";
import { startSession } from "@/src/lib/session";
import { parseSignInAnswer } from "@/src/lib/signInAnswer";
import type { SignInFormState } from "./types";

/**
 * Stores the portal backend's sign-in answer, which the browser received
 * together with the backend's `access_token` cookie, and opens the product
 * the user came from (only a configured product address) or the Portal home.
 * The answer comes from the browser, so it is checked here and only ever
 * displayed; the products' APIs decide access.
 */
export async function completeSignIn(input: {
  email: string;
  answer: unknown;
  returnTo: string | null;
  locale: string;
}): Promise<SignInFormState> {
  const answer = parseSignInAnswer(input.answer);

  if (!answer || !(await startSession(answer))) {
    return {
      status: "failed",
      email: input.email,
      error: "unavailable",
      retryAfterMinutes: null,
    };
  }

  const locale = hasLocale(routing.locales, input.locale)
    ? input.locale
    : routing.defaultLocale;
  const returnTarget = resolveReturnTo(input.returnTo, getProductDestinations());

  redirect(returnTarget?.url ?? `/${locale}`);
}
