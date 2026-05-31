import Link from "next/link";

type SrOnlyEntityLinkProps = {
  href: string;
  label: string;
};

export function SrOnlyEntityLink({ href, label }: SrOnlyEntityLinkProps) {
  return (
    <Link href={href} className="sr-only">
      Ouvrir la fiche : {label}
    </Link>
  );
}
