"use client";

import type { ReactNode } from "react";
import type { ProductKey } from "@/src/lib/productDestinations";
import { useProductCardPointer } from "../hooks/useProductCardPointer";

type ProductCardSurfaceProps = {
  product: ProductKey;
  labelledBy: string;
  className: string;
  children: ReactNode;
};

/**
 * The `<article>` of a linked product card. It adds the pointer effects; the
 * content is rendered on the server and passed in as children.
 */
export default function ProductCardSurface({
  product,
  labelledBy,
  className,
  children,
}: ProductCardSurfaceProps) {
  const { onPointerMove, onPointerLeave } = useProductCardPointer();

  return (
    <article
      data-card
      data-product={product}
      aria-labelledby={labelledBy}
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </article>
  );
}
