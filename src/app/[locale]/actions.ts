"use server";

import { redirect } from "next/navigation";
import { formLocale } from "@/src/lib/formData";
import { endSession } from "@/src/lib/session";

/**
 * Deletes the session cookies, including the access token shared with
 * Ability CRM and Community Admin, which signs the client out of them too.
 */
export async function signOut(formData: FormData): Promise<void> {
  const locale = formLocale(formData);

  await endSession();
  redirect(`/${locale}/sign-in?notice=signed-out`);
}
