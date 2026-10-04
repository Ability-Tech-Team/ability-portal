"use server";

import { redirect } from "next/navigation";
import { formLocale } from "@/src/lib/formData";
import { endSession } from "@/src/lib/session";

/**
 * Signs the client out of the account service and deletes the shared cookie,
 * which also signs them out of Ability CRM and Community Admin.
 */
export async function signOut(formData: FormData): Promise<void> {
  const locale = formLocale(formData);

  await endSession();
  redirect(`/${locale}/sign-in?notice=signed-out`);
}
