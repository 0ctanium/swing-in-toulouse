"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, useAuth } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Protect } from "../admin-protect";
import { useEffect, useRef, useState } from "react";

export function AdminModeBanner({ className }: { className?: string }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const { isLoaded, userId } = useAuth();

  if (isAdminPage || !isLoaded || !userId) {
    return null;
  }

  return <AdminBanner className={className} />;
}

function AdminBanner({ className }: { className?: string }) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState<number>(0);

  useEffect(() => {
    const banner = bannerRef.current;

    console.log("banner", banner);

    if (!banner) return;

    setBannerHeight(banner.clientHeight);

    const resizeObserver = new window.ResizeObserver((entries) => {
      console.log("entries", entries);

      for (const entry of entries) {
        if (entry.target === bannerRef.current) {
          setBannerHeight(entry.contentRect.height);
        }
      }
    });
    resizeObserver.observe(banner);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div style={{ paddingBottom: bannerHeight }} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background w-full"
        ref={bannerRef}
      >
        <div
          className={cn(
            "size-full border-t border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
            className,
          )}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm">
            <div className="inline-flex items-center gap-2">
              <Settings2 className="size-4 shrink-0" />
              <span>Mode admin actif — corrections visibles sur le site.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin"
                className="rounded-md px-2 py-1 font-medium hover:bg-amber-500/15"
              >
                Admin
              </Link>
              <Protect
                fallback={<OrganizationSwitcher hidePersonal />}
                ignoreOrg
              >
                <OrganizationSwitcher />
              </Protect>
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
