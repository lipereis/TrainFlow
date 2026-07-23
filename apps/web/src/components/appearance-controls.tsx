"use client";

import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppearanceControls() {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <LocaleToggle />
      <ThemeToggle />
    </div>
  );
}
