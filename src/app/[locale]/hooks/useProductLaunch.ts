import { useEffect, useState, type MouseEvent } from "react";
import { isPlainLeftClick } from "@/src/lib/pointer";

/** Clears the opening state if the navigation never completes (e.g. Esc). */
const OPENING_RESET_MS = 10_000;

/**
 * Whether the product link was just followed, so the card can show that the
 * product is opening while the other app loads. Only plain left clicks and
 * Enter count; the navigation itself is never prevented or delayed.
 */
export function useProductLaunch() {
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!isOpening) {
      return;
    }

    const reset = () => setIsOpening(false);
    // Going back can restore this page from the back/forward cache with the
    // opening state still set.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        reset();
      }
    };
    const timeout = window.setTimeout(reset, OPENING_RESET_MS);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [isOpening]);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isPlainLeftClick(event)) {
      setIsOpening(true);
    }
  }

  return { isOpening, onClick };
}
