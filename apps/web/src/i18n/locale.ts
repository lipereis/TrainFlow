import { cookies } from "next/headers";
import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "./config";

export async function getLocaleFromCookie(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && isAppLocale(value)) {
    return value;
  }
  return defaultLocale;
}

export async function setLocaleCookie(locale: AppLocale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
