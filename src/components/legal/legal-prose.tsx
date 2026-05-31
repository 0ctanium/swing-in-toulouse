import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LegalProseProps = {
  children: ReactNode;
  className?: string;
};

export function LegalProse({ children, className }: LegalProseProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:mt-10 prose-h2:text-xl prose-h3:text-base",
        "prose-p:text-muted-foreground prose-li:text-muted-foreground",
        "prose-a:text-foreground prose-a:underline",
        className,
      )}
    >
      {children}
    </div>
  );
}
