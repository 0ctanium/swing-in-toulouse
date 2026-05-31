import Link from "next/link";

type PaginationNavProps = {
  previousHref?: string;
  nextHref?: string;
  page: number;
  totalPages: number;
};

export function PaginationNav({
  previousHref,
  nextHref,
  page,
  totalPages,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t pt-6"
    >
      {previousHref ? (
        <Link href={previousHref} className="text-sm font-medium underline">
          Page précédente
        </Link>
      ) : (
        <span aria-hidden />
      )}
      <span className="text-muted-foreground text-sm">
        Page {page} sur {totalPages}
      </span>
      {nextHref ? (
        <Link href={nextHref} className="text-sm font-medium underline">
          Page suivante
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
