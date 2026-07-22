import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  /** Visual size preset */
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: { width: 120, height: 80, className: "h-10 w-auto" },
  md: { width: 160, height: 106, className: "h-14 w-auto" },
  lg: { width: 280, height: 186, className: "h-28 w-auto sm:h-36" },
} as const;

/** TrainFlow mark + wordmark (black canvas — sits on a dark plate in light UI). */
export function BrandLogo({
  href = "/",
  size = "sm",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const s = sizes[size];
  const image = (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-black px-2 py-1.5 ${className}`}
    >
      <Image
        src="/trainflow-logo.png"
        alt="TrainFlow"
        width={s.width}
        height={s.height}
        className={s.className}
        priority={priority}
      />
    </span>
  );

  if (!href) return image;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="TrainFlow">
      {image}
    </Link>
  );
}
