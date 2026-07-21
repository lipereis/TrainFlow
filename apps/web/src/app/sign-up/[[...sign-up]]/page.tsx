import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/post-auth");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp
        routing="hash"
        signInUrl="/sign-in"
        forceRedirectUrl="/post-auth"
        fallbackRedirectUrl="/post-auth"
      />
    </main>
  );
}
