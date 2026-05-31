"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { emptyIcalPayload } from "@/lib/ical/payload";
import {
  siteNavItems,
  siteNavLinkClassName,
  siteNavMobileLinkClassName,
} from "@/lib/site-nav";
import { cn } from "@/lib/utils";

export function SiteHeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {siteNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={siteNavLinkClassName}
          >
            {item.label}
          </Link>
        ))}
        <CalendarSubscribeDialog payload={emptyIcalPayload()}>
          <button type="button" className={siteNavLinkClassName}>
            S&apos;abonner
          </button>
        </CalendarSubscribeDialog>
      </nav>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
            />
          }
        >
          <Menu />
        </DialogTrigger>
        <DialogContent className="top-4 left-4 right-4 w-auto max-w-none translate-none sm:top-1/2 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <nav className="flex min-w-0 flex-col gap-1 overflow-hidden">
            {siteNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={siteNavMobileLinkClassName}
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
            <CalendarSubscribeDialog payload={emptyIcalPayload()}>
              <button
                type="button"
                className={siteNavMobileLinkClassName}
                onClick={closeMobileMenu}
              >
                S&apos;abonner
              </button>
            </CalendarSubscribeDialog>
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
