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
  "px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const segmentIdle =
  "text-muted-foreground hover:bg-muted hover:text-foreground";
const segmentActive =
  "bg-foreground text-background";

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
      className="inline-flex overflow-hidden rounded-xl border border-border"
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
