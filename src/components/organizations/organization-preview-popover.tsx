"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { OrganizationCategoryBadge } from "@/components/organizations/organization-category-badge";
import { OrganizationDanceBadges } from "@/components/organizations/organization-dance-badges";
import {
  OrganizationSocialIconLink,
  OrganizationWebsiteIconLink,
} from "@/components/organizations/organization-social-icons";
import { SrOnlyEntityLink } from "@/components/seo/sr-only-entity-link";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { listOrganizationSocialLinks } from "@/lib/organizations/social-links";
import { cn } from "@/lib/utils";

import type { OrganizerListItem } from "@/components/organizations/organizations-by-dance";

type OrganizationPreviewPopoverProps = {
  organizer: OrganizerListItem;
  contentSide?: "top" | "right" | "bottom" | "left";
  triggerClassName?: string;
  children?: ReactNode;
};

export function OrganizationPreviewPopover({
  organizer,
  contentSide = "bottom",
  triggerClassName,
  children,
}: OrganizationPreviewPopoverProps) {
  const socialLinks = listOrganizationSocialLinks(organizer.socialLinks);
  const hasExternalLinks = organizer.website || socialLinks.length > 0;

  return (
    <>
      <SrOnlyEntityLink
        href={`/organisateur/${organizer.slug}`}
        label={organizer.name}
      />
      <Popover>
      <PopoverTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/60",
          triggerClassName,
        )}
        aria-label={`Aperçu de ${organizer.name}`}
      >
        {children ?? (
          <>
            <span className="min-w-0 text-sm font-medium">
              {organizer.name}
            </span>
            <Info
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={contentSide}
        align="start"
        sideOffset={8}
        className="w-80 gap-0 overflow-hidden p-0 shadow-lg"
      >
        <div className="border-l-4 border-primary">
          <PopoverHeader className="gap-2 p-3 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <OrganizationCategoryBadge category={organizer.category} />
            </div>
            <PopoverTitle className="text-base leading-snug font-semibold">
              {organizer.name}
            </PopoverTitle>
          </PopoverHeader>

          <PopoverDescription className="flex flex-col gap-3 px-3 pb-3 text-sm">
            <OrganizationDanceBadges dances={organizer.dances} />
            {organizer.description ? (
              <p className="text-foreground line-clamp-4">
                {organizer.description}
              </p>
            ) : null}
            {hasExternalLinks ? (
              <div className="flex flex-wrap items-center gap-2">
                {organizer.website ? (
                  <OrganizationWebsiteIconLink url={organizer.website} />
                ) : null}
                {socialLinks.map((link) => (
                  <OrganizationSocialIconLink
                    key={link.platform}
                    platform={link.platform}
                    url={link.url}
                    label={link.label}
                  />
                ))}
              </div>
            ) : null}
          </PopoverDescription>
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}
