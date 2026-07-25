import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale, LOCALE_COOKIE } from "./config";

/** Explicit zone avoids next-intl ENVIRONMENT_FALLBACK in production. */
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    timeZone: DEFAULT_TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
