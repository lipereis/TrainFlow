"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { AppearanceControls } from "@/components/appearance-controls";

const btnPrimary =
  "inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900";
const btnSecondary =
  "inline-flex items-center justify-center rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

/** Landing auth controls — prefer redirect pages over modal to avoid handshake loops. */
export function AuthControls() {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col gap-4">
      <AppearanceControls />
      <div className="flex flex-wrap items-center gap-3">
        <SignedOut>
          <SignInButton mode="redirect" forceRedirectUrl="/post-auth">
            <button type="button" className={btnPrimary}>
              {t("signIn")}
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/post-auth">
            <button type="button" className={btnSecondary}>
              {t("signUpTrainer")}
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
}
