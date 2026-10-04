import { useTranslations } from "next-intl";
import { signOut } from "../actions";
import SignOutButton from "./SignOutButton";

type SignOutFormProps = {
  locale: string;
};

/** Signs out of the Portal and both products. */
export default function SignOutForm({ locale }: SignOutFormProps) {
  const t = useTranslations("Account");

  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <SignOutButton label={t("signOut")} pendingLabel={t("signingOut")} />
    </form>
  );
}
