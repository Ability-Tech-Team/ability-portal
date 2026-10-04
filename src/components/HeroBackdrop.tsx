/**
 * Decorative background of the hero band: the Ability Tech deep navy
 * gradient, a faint grid, two soft glows, and the brand gradient rule at the
 * bottom. The glows sit on the side of their product's card in both
 * languages (Community Admin teal on the left, Ability CRM blue on the right)
 * and drift slowly on wider screens when motion is allowed; only `translate`
 * and `scale` animate.
 */
export default function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-(image:--at-grad-deep)"
    >
      <div className="bg-grid-lines absolute inset-0 [--grid-line:rgb(255_255_255/0.05)] mask-[radial-gradient(ellipse_80%_90%_at_50%_0%,#000_30%,transparent_80%)]" />
      <div className="absolute -top-56 -right-40 size-168 bg-radial from-at-blue-500/45 to-transparent to-70% md:motion-safe:animate-aurora" />
      <div className="absolute -bottom-72 -left-48 size-176bg-radial from-at-teal-500/30 to-transparent to-70% md:motion-safe:animate-aurora-slow" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-(image:--at-grad-rule) opacity-60" />
    </div>
  );
}
