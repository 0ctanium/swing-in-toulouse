import Link from "next/link";

import { SiteHeaderNav } from "@/components/layout/site-header-nav";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="min-w-0 shrink">
          <span className="font-heading block text-xl font-semibold tracking-tight">
            Swing in Toulouse
          </span>
          <span className="text-muted-foreground block text-xs">
            Lindy Hop · Boogie · Bal swing
          </span>
        </Link>
        <SiteHeaderNav />
      </div>
    </header>
  );
}
