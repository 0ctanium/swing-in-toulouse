import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import slugify from "slugify";

import { LegalProse } from "@/components/legal/legal-prose";

function headingToId(text: string) {
  return slugify(text.replace(/^\d+\.\s*/, ""), {
    lower: true,
    strict: true,
    locale: "fr",
  });
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => <LegalProse>{children}</LegalProse>,
    h2: ({ children }) => {
      const text = String(children);
      return (
        <h2 id={headingToId(text)} className="scroll-mt-6">
          {children}
        </h2>
      );
    },
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
    ...components,
  };
}
