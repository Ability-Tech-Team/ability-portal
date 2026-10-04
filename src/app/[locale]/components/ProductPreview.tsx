import { Bell, Check, House } from "lucide-react";
import type { ProductKey } from "@/src/lib/productDestinations";

type ProductPreviewProps = {
  product: ProductKey;
  /** Faded and still, for a card without a destination. */
  muted?: boolean;
};

// Bar heights at rest and on an active card; the delays stagger the growth.
const crmBars = [
  "h-[30%] card-active:h-[48%] delay-0",
  "h-[52%] card-active:h-[66%] delay-40",
  "h-[40%] card-active:h-[60%] delay-80",
  "h-[64%] card-active:h-[84%] delay-120",
  "h-[46%] card-active:h-[72%] delay-160",
  "h-[70%] card-active:h-[94%] delay-200",
  "h-[58%] card-active:h-[86%] delay-240",
];

// Overlapping avatars in brand colors that spread apart on an active card.
const crmAvatars = [
  "from-product to-product-soft",
  "-ms-2.5 from-at-teal-500 to-at-green-500 motion-safe:card-active:ms-1",
  "-ms-2.5 from-at-navy-700 to-at-blue-500 motion-safe:card-active:ms-1",
];

const sparkline = "M3 33C14 30 20 16 32 20S52 34 64 22S88 6 109 7";

const skeletonStrong = "bg-at-navy-800/15 dark:bg-white/20";
const skeletonSoft = "bg-at-navy-800/10 dark:bg-white/10";
const chip =
  "bg-white text-product-ink shadow-lg shadow-at-navy-800/5 ring-1 ring-at-navy-800/5 dark:bg-at-navy-700 dark:ring-white/10";

function CrmScene() {
  return (
    <>
      <div className="absolute inset-s-4 top-4 w-40 rounded-xl bg-white p-3 shadow-lg shadow-at-navy-800/5 ring-1 ring-at-navy-800/5 transition-[translate] duration-500 ease-out-soft motion-safe:card-active:-translate-y-1 dark:bg-at-navy-700 dark:ring-white/10">
        <div className="flex items-center gap-2.5">
          <span className="size-8 shrink-0 rounded-full bg-linear-135 from-product to-product-soft" />
          <span className="flex-1 space-y-1.5">
            <span className={`block h-2 w-4/5 rounded-full ${skeletonStrong}`} />
            <span className={`block h-2 w-1/2 rounded-full ${skeletonSoft}`} />
          </span>
        </div>
        <span className="absolute -inset-e-2 -top-2 flex size-6 items-center justify-center rounded-full bg-product-solid text-on-product opacity-0 shadow-md shadow-product/30 transition-[opacity,scale] duration-300 ease-out-soft card-active:opacity-100 motion-safe:scale-50 motion-safe:card-active:scale-100">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </div>

      <svg
        viewBox="0 0 112 40"
        fill="none"
        className="absolute inset-e-4 top-4 h-10 w-28"
      >
        <path
          d={sparkline}
          strokeWidth={3}
          strokeLinecap="round"
          className="stroke-at-navy-800/10 dark:stroke-white/15"
        />
        <path
          d={sparkline}
          pathLength={1}
          strokeDasharray={1}
          strokeWidth={3}
          strokeLinecap="round"
          className="stroke-product opacity-0 transition-[stroke-dashoffset,opacity] duration-700 ease-out-soft [stroke-dashoffset:1] card-active:opacity-100 card-active:[stroke-dashoffset:0] motion-reduce:transition-none"
        />
      </svg>

      <div className="absolute inset-s-4 bottom-4 flex">
        {crmAvatars.map((avatar) => (
          <span
            key={avatar}
            className={`size-8 rounded-full bg-linear-135 ring-2 ring-white transition-[margin] duration-500 ease-out-soft dark:ring-at-navy-800 ${avatar}`}
          />
        ))}
      </div>

      <div className="absolute inset-e-4 bottom-4 flex h-16 items-end gap-1.5">
        {crmBars.map((bar) => (
          <span
            key={bar}
            className={`w-2.5 rounded-full bg-linear-to-t from-product/80 to-product-soft transition-[height] duration-500 ease-out-soft motion-reduce:transition-none ${bar}`}
          />
        ))}
      </div>
    </>
  );
}

function NotificationRow({ fresh = false }: { fresh?: boolean }) {
  return (
    <div
      className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-1.5 ${
        fresh
          ? "bg-product/15 opacity-0 transition-opacity duration-300 card-active:opacity-100"
          : "bg-at-navy-800/5 dark:bg-white/5"
      }`}
    >
      <span
        className={`size-4 shrink-0 rounded-md ${
          fresh ? "bg-(image:--product-fill)" : skeletonStrong
        }`}
      />
      <span className="flex-1 space-y-1">
        <span className={`block h-1.5 w-4/5 rounded-full ${skeletonStrong}`} />
        <span className={`block h-1.5 w-1/2 rounded-full ${skeletonSoft}`} />
      </span>
    </div>
  );
}

function CommunityScene() {
  return (
    <>
      <div className="absolute inset-x-0 -bottom-14 mx-auto h-44 w-36 rounded-[1.6rem] border-[5px] border-at-navy-800 bg-white shadow-xl shadow-at-navy-800/15 dark:border-at-navy-600 dark:bg-at-navy-900">
        <span className="absolute inset-x-0 top-1.5 mx-auto h-1.5 w-9 rounded-full bg-at-navy-800 dark:bg-at-navy-600" />
        <div className="absolute inset-x-2 top-5 bottom-0 overflow-hidden">
          {/* One row height plus the gap (34px): the fresh row waits above
              the screen and slides in on an active card. */}
          <div className="flex -translate-y-8.5 flex-col gap-1.5 transition-[translate] duration-500 ease-out-soft card-active:translate-y-0 motion-reduce:transition-none">
            <NotificationRow fresh />
            <NotificationRow />
            <NotificationRow />
            <NotificationRow />
          </div>
        </div>
      </div>

      <span
        className={`absolute inset-e-5 top-5 flex size-10 items-center justify-center rounded-2xl ${chip}`}
      >
        <Bell className="size-5 origin-top motion-safe:card-active:animate-wiggle" />
        <span className="absolute -inset-e-0.5 -top-0.5 flex size-3 opacity-0 transition-opacity duration-300 card-active:opacity-100">
          <span className="absolute inline-flex size-full rounded-full bg-product opacity-75 motion-safe:card-active:animate-ping" />
          <span className="relative inline-flex size-3 rounded-full bg-product-solid ring-2 ring-white dark:ring-at-navy-700" />
        </span>
      </span>

      <span
        className={`absolute inset-s-5 top-9 flex size-9 items-center justify-center rounded-xl motion-safe:card-active:animate-float ${chip}`}
      >
        <House className="size-4" />
      </span>
    </>
  );
}

/**
 * A decorative miniature of the product: skeleton shapes only, with no names,
 * numbers, or other data. It comes alive when its card is active.
 */
export default function ProductPreview({
  product,
  muted = false,
}: ProductPreviewProps) {
  return (
    <div
      aria-hidden
      className={`relative h-40 shrink-0 overflow-hidden rounded-2xl bg-at-mist bg-linear-to-br from-product/15 via-product-soft/10 to-transparent ring-1 ring-at-line/70 ring-inset sm:h-44 dark:bg-at-navy-900/60 dark:from-product/20 dark:ring-white/5 ${
        muted ? "opacity-60 grayscale" : ""
      }`}
    >
      <div className="bg-grid-lines absolute inset-0 mask-[linear-gradient(to_bottom,#000,transparent_85%)]" />
      {product === "crm" ? <CrmScene /> : <CommunityScene />}
    </div>
  );
}
