"use server";

import { redirect } from "next/navigation";
import { formLocale } from "@/src/lib/formData";
import { endSession } from "@/src/lib/session";

/**
 * Deletes the Portal's session cookie, which Ability CRM and Community Admin
 * read too. The browser has already asked the portal backend to clear its
 * `access_token` (`SignOutForm`).
 */
export async function signOut(formData: FormData): Promise<void> {
  const locale = formLocale(formData);

  await endSession();
  redirect(`/${locale}/sign-in?notice=signed-out`);
}
