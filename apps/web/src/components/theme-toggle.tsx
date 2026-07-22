"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeValue = "light" | "dark" | "system";

const options: { value: ThemeValue; key: "themeLight" | "themeDark" | "themeSystem" }[] =
  [
    { value: "light", key: "themeLight" },
    { value: "dark", key: "themeDark" },
    { value: "system", key: "themeSystem" },
  ];

const segmentBase =
  "px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const segmentIdle =
  "text-muted-foreground hover:bg-muted hover:text-foreground";
const segmentActive =
  "bg-foreground text-background";

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? (theme as ThemeValue | undefined) : undefined;

  return (
    <div
      role="group"
      aria-label={t("theme")}
      className="inline-flex overflow-hidden rounded-xl border border-border"
    >
      {options.map((opt) => {
        const isActive = active === opt.value;
        const label = t(opt.key);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${t("theme")}: ${label}`}
            onClick={() => setTheme(opt.value)}
            className={`${segmentBase} ${isActive ? segmentActive : segmentIdle}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
