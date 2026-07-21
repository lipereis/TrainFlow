import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/post-auth");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        forceRedirectUrl="/post-auth"
        fallbackRedirectUrl="/post-auth"
      />
    </main>
  );
}
