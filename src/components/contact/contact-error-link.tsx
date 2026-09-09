import Link from "next/link";

import { cn } from "@/lib/utils";

type ContactErrorLinkProps = {
  page?: string;
  className?: string;
};

export function contactPageHref(page?: string) {
  if (!page || !page.startsWith("/")) {
    return "/contact";
  }

  return `/contact?page=${encodeURIComponent(page)}`;
}

export function ContactErrorLink({ page, className }: ContactErrorLinkProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>
      Une erreur ?{" "}
      <Link
        href={contactPageHref(page)}
        className="text-foreground underline hover:no-underline"
      >
        Contactez-moi
      </Link>
    </p>
  );
}
