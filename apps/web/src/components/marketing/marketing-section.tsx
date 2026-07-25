import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/container";
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "dark" | "light" | "lightMuted";

const toneClass: Record<Tone, string> = {
  dark: "bg-mkt-dark text-white",
  light: "bg-mkt-light text-mkt-light-fg",
  lightMuted: "bg-mkt-light-muted text-mkt-light-fg",
};

type MarketingSectionProps = HTMLAttributes<HTMLElement> & {
  tone?: Tone;
  children: ReactNode;
  contained?: boolean;
  wide?: boolean;
};

export function MarketingSection({
  tone = "light",
  children,
  className,
  contained = true,
  wide = false,
  ...props
}: MarketingSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {contained ? (
        <Container className={cn(wide && "max-w-7xl")}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
