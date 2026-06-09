import type { ReactNode } from "react";
import { ArrowUpRight, Globe } from "lucide-react";

import {
  FacebookIcon,
  WhatsappIcon,
} from "@/components/community/community-icons";
import {
  externalResourceCategories,
  facebookGroups,
  type CommunityLink,
  type CommunityResourceCategory,
  whatsappGroups,
} from "@/lib/community/links";
import { cn } from "@/lib/utils";

function SectionHeader() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2
        id="community-heading"
        className="font-heading text-2xl font-semibold tracking-tight md:text-3xl"
      >
        Communauté et ressources
      </h2>
      <div
        className="bg-primary/30 mx-auto mt-4 h-px w-16"
        role="presentation"
        aria-hidden
      />
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
        Discussions locales par style de danse, calendriers partagés et agendas
        festivals pour planifier vos sorties swing à Toulouse.
      </p>
    </div>
  );
}

function CommunityCard({
  title,
  icon,
  iconClassName,
  children,
}: {
  title: string;
  icon: ReactNode;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <article className="bg-card text-card-foreground flex flex-col gap-5 rounded-2xl border p-5 shadow-sm md:p-6">
      <header className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h3 className="font-heading text-xl font-semibold">{title}</h3>
      </header>
      {children}
    </article>
  );
}

function ExternalCommunityLink({
  link,
  className,
}: {
  link: CommunityLink;
  className?: string;
}) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group/link focus-visible:ring-ring flex items-start gap-2 rounded-lg outline-none transition-colors focus-visible:ring-2",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="text-primary group-hover/link:text-primary/80 text-sm font-medium underline-offset-4 group-hover/link:underline">
          {link.label}
        </span>
        {link.description ? (
          <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
            {link.description}
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        className="text-muted-foreground group-hover/link:text-primary mt-0.5 size-3.5 shrink-0 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:opacity-100 group-focus-visible/link:opacity-100"
        aria-hidden
      />
    </a>
  );
}

function WhatsappTree({ links }: { links: CommunityLink[] }) {
  return (
    <ol className="relative flex flex-col gap-0">
      {links.map((link, index) => {
        const isLast = index === links.length - 1;

        return (
          <li key={link.id} className="relative flex gap-3 pb-5 last:pb-0">
            <div className="flex w-5 shrink-0 flex-col items-center">
              <span
                className="bg-primary ring-background z-10 size-2.5 shrink-0 rounded-full ring-4"
                aria-hidden
              />
              {!isLast ? (
                <span className="bg-border mt-1 w-px flex-1" aria-hidden />
              ) : null}
            </div>
            <div
              className={cn(
                "bg-muted/60 -mt-0.5 flex-1 rounded-lg border border-transparent px-3 py-2.5 transition-colors",
                "hover:border-primary/15 hover:bg-muted",
              )}
            >
              <ExternalCommunityLink link={link} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function FacebookList({ links }: { links: CommunityLink[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {links.map((link) => (
        <li key={link.id} className="flex gap-3">
          <span
            className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
            aria-hidden
          />
          <ExternalCommunityLink link={link} className="flex-1" />
        </li>
      ))}
    </ul>
  );
}

function ExternalResourcesList({
  categories,
}: {
  categories: CommunityResourceCategory[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <div key={category.id} className="flex flex-col gap-3">
          <h4 className="border-primary text-primary border-l-4 pl-3 text-sm font-semibold">
            {category.title}
          </h4>
          <ul className="flex flex-col gap-3 pl-1">
            {category.links.map((link) => (
              <li key={link.id} className="flex gap-3">
                <span
                  className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
                  aria-hidden
                />
                <ExternalCommunityLink link={link} className="flex-1" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CommunityLinksSection() {
  const hasExternalResources = externalResourceCategories.some(
    (category) => category.links.length > 0,
  );

  if (
    whatsappGroups.length === 0 &&
    facebookGroups.length === 0 &&
    !hasExternalResources
  ) {
    return null;
  }

  return (
    <section
      id="communaute"
      aria-labelledby="community-heading"
      className="flex scroll-mt-6 flex-col gap-8 rounded-2xl border border-border/60 bg-muted/40 px-5 py-10 md:px-8"
    >
      <SectionHeader />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {whatsappGroups.length > 0 ? (
          <CommunityCard
            title="WhatsApp"
            icon={<WhatsappIcon />}
            iconClassName="bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366]"
          >
            <WhatsappTree links={whatsappGroups} />
          </CommunityCard>
        ) : null}

        {facebookGroups.length > 0 ? (
          <CommunityCard
            title="Facebook"
            icon={<FacebookIcon />}
            iconClassName="bg-[#1877F2]/12 text-[#1877F2]"
          >
            <FacebookList links={facebookGroups} />
          </CommunityCard>
        ) : null}

        {hasExternalResources ? (
          <CommunityCard
            title="Ressources externes"
            icon={<Globe className="size-5" aria-hidden />}
            iconClassName="bg-accent text-accent-foreground"
          >
            <ExternalResourcesList categories={externalResourceCategories} />
          </CommunityCard>
        ) : null}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Liens externes, vous quittez Swingin Toulouse.
      </p>
    </section>
  );
}
