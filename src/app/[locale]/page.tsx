import { Building2, Info, UsersRound, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import {
  getProductDestinations,
  type ProductKey,
} from "@/src/lib/productDestinations";
import ProductCard from "./components/ProductCard";
import { buildProductCards } from "./utils";

const productIcons: Record<ProductKey, LucideIcon> = {
  crm: UsersRound,
  communityAdmin: Building2,
};

export default function ProductSelectionPage() {
  const t = useTranslations("Home");
  const tProducts = useTranslations("Products");
  const locale = useLocale();
  const cards = buildProductCards(getProductDestinations(), locale);

  return (
    <>
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <p className="text-lg font-semibold tracking-tight">{t("brand")}</p>
          <LocaleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <h1
          id="product-selection-title"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          {t("intro")}
        </p>

        <p
          role="note"
          className="mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{t("previewNotice")}</span>
        </p>

        <ul
          aria-labelledby="product-selection-title"
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {cards.map((card) => {
            const name = tProducts(`${card.key}.name`);

            return (
              <li key={card.key} className="flex">
                <ProductCard
                  card={card}
                  icon={productIcons[card.key]}
                  name={name}
                  description={tProducts(`${card.key}.description`)}
                  openLabel={t("open", { product: name })}
                  pendingTitle={t("configurationPending")}
                  pendingDescription={t("configurationPendingDescription")}
                />
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
