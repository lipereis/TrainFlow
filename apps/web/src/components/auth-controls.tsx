"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const btnPrimary =
  "inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white";
const btnSecondary =
  "inline-flex items-center justify-center rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900";

/** Landing / header auth controls — Sign in, Sign up, or UserButton when signed in. */
export function AuthControls() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className={btnPrimary}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className={btnSecondary}>
            Sign up as trainer
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
