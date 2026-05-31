import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LegalProse } from "@/components/legal/legal-prose";
import { cn } from "@/lib/utils";

type EventDescriptionMarkdownProps = {
  description: string;
  className?: string;
};

export function EventDescriptionMarkdown({
  description,
  className,
}: EventDescriptionMarkdownProps) {
  return (
    <LegalProse className={cn("text-base", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return <Link href={href}>{children}</Link>;
            }

            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(isExternal
                  ? { rel: "noopener noreferrer", target: "_blank" }
                  : undefined)}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {description}
      </ReactMarkdown>
    </LegalProse>
  );
}
