import { ClerkProvider } from "@clerk/nextjs";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: "TrainFlow",
    description: t("appDescription"),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AppProviders locale={locale} messages={messages}>
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/post-auth"
            signUpFallbackRedirectUrl="/post-auth"
            afterSignOutUrl="/"
          >
            {children}
          </ClerkProvider>
        </AppProviders>
      </body>
    </html>
  );
}
