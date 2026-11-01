"use client";

import { useTranslations } from "next-intl";
import { getPortalApiUrl } from "@/src/lib/portalApi";
import { signOut as signOutOfBackend } from "@/src/services/portalAuth";
import { signOut } from "../actions";
import SignOutButton from "./SignOutButton";

type SignOutFormProps = {
  locale: string;
};

/**
 * The browser asks the portal backend to clear its `access_token` (best
 * effort; the cookie is the browser's), then the Portal deletes its own
 * session cookie.
 */
async function signOutEverywhere(formData: FormData): Promise<void> {
  const baseUrl = getPortalApiUrl();

  if (baseUrl) {
    await signOutOfBackend(baseUrl);
  }

  await signOut(formData);
}

/** Signs out of the Portal and both products. */
export default function SignOutForm({ locale }: SignOutFormProps) {
  const t = useTranslations("Account");

  return (
    <form action={signOutEverywhere}>
      <input type="hidden" name="locale" value={locale} />
      <SignOutButton label={t("signOut")} pendingLabel={t("signingOut")} />
    </form>
  );
}
