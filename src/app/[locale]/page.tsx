import { BuildingComplex, UsersRound, type LucideIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { highlight } from "@/src/components/highlight";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import PortalShell from "@/src/components/PortalShell";
import { redirect } from "@/src/i18n/navigation";
import { getLocaleDirection, routing } from "@/src/i18n/routing";
import {
  getProductDestinations,
  type ProductKey,
} from "@/src/lib/productDestinations";
import { getCurrentSession } from "@/src/lib/session";
import AccountBadge from "./components/AccountBadge";
import ProductCard from "./components/ProductCard";
import SignOutForm from "./components/SignOutForm";
import type { ProductCardModel } from "./types";
import { buildProductCards, orderCardsForScreen } from "./utils";

type Props = {
  params: Promise<{ locale: string }>;
};

const productIcons: Record<ProductKey, LucideIcon> = {
  crm: UsersRound,
  communityAdmin: BuildingComplex,
};

// Entrance delays for the cards in reading order. Literal class names, so
// that Tailwind generates them.
const cardEnterDelays = ["enter-delay-360", "enter-delay-460"];

export default async function ProductSelectionPage({ params }: Props) {
  const { locale } = await params;
  const session = await getCurrentSession();

  if (session.status === "signed-out") {
    return redirect({ href: "/sign-in", locale });
  }

  const t = await getTranslations("Home");
  const tProducts = await getTranslations("Products");
  const headerActions = (
    <>
      <SignOutForm locale={locale} />
      <LocaleSwitcher />
    </>
  );

  const direction = hasLocale(routing.locales, locale)
    ? getLocaleDirection(locale)
    : "ltr";
  const cards = orderCardsForScreen(
    buildProductCards(getProductDestinations(), locale, session.products),
    direction,
  );

  function cardNotice(card: ProductCardModel, product: string) {
    switch (card.state) {
      case "available":
        return null;
      case "configuration-pending":
        return {
          title: t("configurationPending"),
          description: t("configurationPendingDescription"),
        };
      case "not-included":
        return {
          title: t("notIncluded"),
          description: t("notIncludedDescription", { product }),
        };
    }
  }

  return (
    <PortalShell
      headerActions={headerActions}
      eyebrow={t("eyebrow")}
      title={t.rich("title", { highlight })}
      titleId="product-selection-title"
      intro={t("intro")}
      heroFooter={<AccountBadge account={session.account} />}
    >
      <ul
        data-card-grid
        aria-labelledby="product-selection-title"
        className="grid gap-6 md:grid-cols-2 lg:gap-8"
      >
        {cards.map((card, index) => {
          const name = tProducts(`${card.key}.name`);

          return (
            <li
              key={card.key}
              className={`flex transition-[scale] duration-500 ease-out-soft perspective-distant motion-safe:animate-enter ${
                cardEnterDelays[index] ?? "enter-delay-460"
              }`}
            >
              <ProductCard
                card={card}
                icon={productIcons[card.key]}
                name={name}
                description={tProducts(`${card.key}.description`)}
                openLabel={t("open", { product: name })}
                openingLabel={t("opening", { product: name })}
                notice={cardNotice(card, name)}
              />
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
