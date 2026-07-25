import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/container";
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "dark" | "light" | "lightMuted";

/** Same palette as dashboard / trainer shell (theme tokens). */
const toneClass: Record<Tone, string> = {
  dark: "border-y border-border/60 bg-muted text-foreground",
  light: "bg-background text-foreground",
  lightMuted: "bg-muted/40 text-foreground",
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
      className={cn("relative overflow-hidden", toneClass[tone], className)}
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
