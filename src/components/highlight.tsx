import type { ReactNode } from "react";

/** Renders `<highlight>` in translated hero titles with the accent gradient. */
export function highlight(chunks: ReactNode) {
  return (
    <span className="text-accent-gradient inline-block py-[0.12em] motion-safe:animate-gradient-pan">
      {chunks}
    </span>
  );
}
