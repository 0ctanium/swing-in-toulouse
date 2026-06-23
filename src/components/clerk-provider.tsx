"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { frFR } from "@clerk/localizations";

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{ theme: shadcn }}
      localization={frFR}
      signInUrl="/admin/login"
      signUpUrl="/admin/login"
    >
      {children}
    </ClerkProvider>
  );
}
