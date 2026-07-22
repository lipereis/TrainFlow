"use server";

import { revalidatePath } from "next/cache";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/locale";

export async function setLocale(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
  await setLocaleCookie(locale);
  revalidatePath("/", "layout");
}
