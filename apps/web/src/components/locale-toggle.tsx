"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import type { AppLocale } from "@/i18n/config";

const options: { value: AppLocale; label: string }[] = [
  { value: "pt-BR", label: "PT" },
  { value: "en", label: "EN" },
];

const segmentBase =
  "px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500";
const segmentIdle =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const segmentActive =
  "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";

export function LocaleToggle() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(next: AppLocale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="inline-flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-700"
    >
      {options.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={pending}
            aria-pressed={active}
            aria-label={`${t("language")}: ${opt.label}`}
            onClick={() => onSelect(opt.value)}
            className={`${segmentBase} ${active ? segmentActive : segmentIdle}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
