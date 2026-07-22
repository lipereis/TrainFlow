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
  "px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500";
const segmentIdle =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const segmentActive =
  "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";

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
      className="inline-flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-700"
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
