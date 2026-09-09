import type { Metadata } from "next";
import { Suspense } from "react";

import { ContactChannels } from "@/components/contact/contact-channels";
import { ContactForm } from "@/components/contact/contact-form";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublicContactChannels } from "@/lib/contact/channels";
import { hasEditorPhone } from "@/lib/contact/editor";
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
  const channels = listPublicContactChannels();
  const canRevealPhone = hasEditorPhone();

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

      <div className="grid gap-10 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start">
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">Me joindre</h2>
          <p className="text-muted-foreground text-sm">
            {canRevealPhone
              ? "WhatsApp et le téléphone sont les plus rapides. Le numéro s'affiche seulement si vous le demandez."
              : "Un email, Instagram, Facebook ou le formulaire à côté suffisent."}
          </p>
          <ContactChannels
            channels={channels}
            canRevealPhone={canRevealPhone}
          />
        </section>

        <section className="flex max-w-xl flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">Formulaire</h2>
          <p className="text-muted-foreground text-sm">
            Nom, email et message suffisent. Je vous réponds sur l&apos;adresse
            indiquée.
          </p>
          <Suspense fallback={<ContactFormFallback />}>
            <ContactFormSection {...props} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
