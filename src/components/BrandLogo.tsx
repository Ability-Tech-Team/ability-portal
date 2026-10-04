import Image from "next/image";
import markColor from "@/public/brand/ability-tech-mark.png";
import markWhite from "@/public/brand/ability-tech-mark-white.png";

type BrandLogoProps = {
  /** Rendered height in px; the width follows the logo's proportions. */
  height: number;
  /** "auto": the color logo, white in dark mode. "white": always white, for
   * navy backgrounds. */
  tone?: "auto" | "white";
  className?: string;
};

/**
 * The official Ability Tech logo (the "A" mark above the wordmark), from
 * ability-tech.com.
 */
export default function BrandLogo({
  height,
  tone = "auto",
  className = "",
}: BrandLogoProps) {
  // Both files are 242 x 256. The size is pinned inline because the resized
  // files the image optimizer serves round their proportions slightly, which
  // would make `height: auto` disagree with the height attribute.
  const width = Math.round((markColor.width * height) / markColor.height);
  const size = { width, height };

  if (tone === "white") {
    return (
      <Image
        src={markWhite}
        alt="Ability Tech"
        {...size}
        style={size}
        className={className}
      />
    );
  }

  // One image per color scheme. Images load lazily by default, so the one
  // hidden by the media query is never downloaded.
  return (
    <>
      <Image
        src={markColor}
        alt="Ability Tech"
        {...size}
        style={size}
        className={`dark:hidden ${className}`}
      />
      <Image
        src={markWhite}
        alt="Ability Tech"
        {...size}
        style={size}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
