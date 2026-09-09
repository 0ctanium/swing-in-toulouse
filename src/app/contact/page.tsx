import type { Metadata } from "next";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact/contact-form";
import { Skeleton } from "@/components/ui/skeleton";
import { publicMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Contact",
  description: `Une erreur dans l'agenda, un événement à ajouter, une question : contactez ${siteConfig.name}.`,
  path: "/contact",
});

type ContactPageProps = {
  searchParams: Promise<{ page?: string }>;
};

function ContactFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

async function ContactFormSection({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const page =
    typeof params.page === "string" && params.page.startsWith("/")
      ? params.page
      : null;

  return <ContactForm pageContext={page} />;
}

export default function ContactPage(props: ContactPageProps) {
  return (
    <div className="flex flex-col gap-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Une erreur ? Contactez-moi
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          Benjamin, éditeur de {siteConfig.name}. Un trou dans l&apos;agenda,
          une info fausse, un événement à ajouter : le plus simple est de
          m&apos;écrire. Je suis notifié tout de suite.
        </p>
      </div>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Formulaire</h2>
        <p className="text-muted-foreground text-sm">
          Nom, email, téléphone et message suffisent. Je vous réponds sur
          l&apos;adresse ou le numéro indiqués.
        </p>
        <Suspense fallback={<ContactFormFallback />}>
          <ContactFormSection {...props} />
        </Suspense>
      </section>
    </div>
  );
}
