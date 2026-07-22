export const locales = ["pt-BR", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "pt-BR";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
