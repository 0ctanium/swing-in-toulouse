import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/admin/auth";

type AdminLoginPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/admin");
  }

  const { redirect_url: redirectUrl } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-semibold">Connexion</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Accès sur invitation uniquement. Contactez l&apos;équipe si vous avez
          reçu une invitation.
        </p>
      </div>
      <SignIn
        fallbackRedirectUrl={redirectUrl ?? "/"}
        {...(redirectUrl ? { forceRedirectUrl: redirectUrl } : {})}
        withSignUp={false}
      />
    </div>
  );
}
