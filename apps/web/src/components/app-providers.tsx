"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";

type AppProvidersProps = {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
};

/**
 * Client bridge for theme + intl. ClerkProvider stays in the server layout
 * so its Next.js-specific props remain on the server tree.
 */
export function AppProviders({ locale, messages, children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="trainflow-theme"
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
