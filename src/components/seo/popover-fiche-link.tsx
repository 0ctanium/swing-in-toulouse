import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type PopoverFicheLinkProps = {
  href: string;
  label: string;
  embedded?: boolean;
};

export function PopoverFicheLink({
  href,
  label,
  embedded = false,
}: PopoverFicheLinkProps) {
  const link = (
    <Link
      href={href}
      className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
    >
      Ouvrir la fiche
      <span className="sr-only"> : {label}</span>
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
    </Link>
  );

  if (embedded) {
    return link;
  }

  return <div className="border-t bg-muted/30 px-3 py-2">{link}</div>;
}
