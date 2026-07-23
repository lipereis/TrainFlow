import { ClerkProvider } from "@clerk/nextjs";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: "TrainFlow",
    description: t("appDescription"),
    icons: {
      icon: "/favicon.png",
      apple: "/favicon.png",
    },
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
    <html lang={locale} className={GeistSans.variable} suppressHydrationWarning>
      <body className="font-sans">
        <AppProviders locale={locale} messages={messages}>
          <ClerkProvider
            dynamic
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
