import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  /** Visual size preset */
  size?: "xs" | "nav" | "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

/** Display height in px — trimmed asset is 374×317 */
const sizes = {
  xs: { height: 36 },
  /** Compact chrome / marketing nav */
  nav: { height: 52 },
  sm: { height: 72 },
  md: { height: 96 },
  lg: { height: 160 },
} as const;

const ASPECT = 374 / 317;

/** TrainFlow mark + wordmark with transparent background. */
export function BrandLogo({
  href = "/",
  size = "sm",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const height = sizes[size].height;
  const width = Math.round(height * ASPECT);
  const image = (
    // Plain img so display size always wins (next/image CSS can clamp height).
    <img
      src="/trainflow-logo.png"
      alt="TrainFlow"
      width={width}
      height={height}
      style={{ width, height, maxWidth: "none", display: "block" }}
      className={className}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );

  if (!href) return image;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="TrainFlow">
      {image}
    </Link>
  );
}
