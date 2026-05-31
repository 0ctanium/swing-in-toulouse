"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  buildCalendarSubscribeOptions,
  getIcalFeedAbsoluteUrl,
} from "@/lib/ical/subscribe";
import type { IcalPayload } from "@/lib/ical/payload";
import { cn } from "@/lib/utils";

type CalendarSubscribeDialogProps = {
  payload: IcalPayload;
  feedName?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function CalendarSubscribeDialog({
  payload,
  feedName,
  title = "S'abonner au calendrier",
  description = "Choisissez votre application pour ajouter ou synchroniser ce calendrier.",
  children,
}: CalendarSubscribeDialogProps) {
  const [copied, setCopied] = useState(false);
  const feedUrl = useMemo(() => getIcalFeedAbsoluteUrl(payload), [payload]);
  const options = useMemo(
    () => buildCalendarSubscribeOptions(payload, feedName),
    [feedName, payload],
  );

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast.success("Lien du calendrier copié.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }

  return (
    <Dialog>
      {children ? <DialogTrigger>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto justify-start px-3 py-3 text-left"
              render={
                <a
                  href={option.href}
                  {...(option.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : option.id === "download"
                      ? { download: true }
                      : {})}
                />
              }
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="inline-flex items-center gap-2 font-medium">
                  {option.label}
                  {option.external ? (
                    <ExternalLink className="size-3.5 shrink-0 opacity-60" />
                  ) : null}
                </span>
                {option.description ? (
                  <span className="text-muted-foreground text-xs font-normal">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Lien du flux
          </p>
          <div className="flex gap-2">
            <Input readOnly value={feedUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copier le lien du calendrier"
              onClick={copyFeedUrl}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
