"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const TAP_COUNT = 5;
const TAP_WINDOW_MS = 2000;

export function FooterSiteNameSecret({ children }: { children: string }) {
  const router = useRouter();
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  function handleActivate() {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapCountRef.current += 1;

    if (tapCountRef.current >= TAP_COUNT) {
      tapCountRef.current = 0;
      router.push("/admin");
      return;
    }

    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, TAP_WINDOW_MS);
  }

  return <span onClick={handleActivate}>{children}</span>;
}
