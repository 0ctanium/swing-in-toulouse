"use client";

import { Mail, Phone } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState, useTransition } from "react";

import { revealEditorPhone } from "@/app/contact/actions";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
} from "@/components/community/community-icons";
import type { EditorDirectContact } from "@/lib/contact/direct-contact";
import type {
  PublicContactChannel,
  PublicContactChannelId,
} from "@/lib/contact/channels";
import { cn } from "@/lib/utils";

const channelIcons: Record<
  PublicContactChannelId,
  ComponentType<{ className?: string }>
> = {
  email: Mail,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

const cardClassName = cn(
  "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors",
  "hover:bg-muted/60 hover:text-foreground",
);

type ContactChannelsProps = {
  channels: PublicContactChannel[];
  canRevealPhone?: boolean;
};

export function ContactChannels({
  channels,
  canRevealPhone = false,
}: ContactChannelsProps) {
  const [direct, setDirect] = useState<EditorDirectContact | null>(null);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadDirectContact(after?: (contact: EditorDirectContact) => void) {
    if (direct) {
      after?.(direct);
      return;
    }

    startTransition(async () => {
      const result = await revealEditorPhone();
      if (result.status !== "ok") {
        setError(result.message);
        return;
      }

      setDirect(result.contact);
      setError(null);
      after?.(result.contact);
    });
  }

  if (channels.length === 0 && !canRevealPhone) {
    return null;
  }

  const emailChannel = channels.find((channel) => channel.id === "email");
  const otherChannels = channels.filter((channel) => channel.id !== "email");

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {emailChannel ? (
          <li>
            <ChannelLink channel={emailChannel} />
          </li>
        ) : null}

        {canRevealPhone ? (
          <li>
            {phoneRevealed && direct ? (
              <ChannelAnchor
                href={direct.phoneHref}
                label="Téléphone"
                display={direct.phoneDisplay}
                icon={Phone}
              />
            ) : (
              <button
                type="button"
                className={cardClassName}
                disabled={pending}
                aria-label="Afficher le numéro de téléphone"
                onClick={() => {
                  loadDirectContact(() => setPhoneRevealed(true));
                }}
              >
                <ChannelInner
                  icon={Phone}
                  label="Téléphone"
                  display={pending ? "Chargement…" : "Afficher le numéro"}
                />
              </button>
            )}
          </li>
        ) : null}

        {canRevealPhone ? (
          <li>
            {direct ? (
              <ChannelAnchor
                href={direct.whatsappHref}
                label="WhatsApp"
                display="M'écrire sur WhatsApp"
                icon={WhatsappIcon}
                external
              />
            ) : (
              <button
                type="button"
                className={cardClassName}
                disabled={pending}
                aria-label="Ouvrir WhatsApp"
                onClick={() => {
                  loadDirectContact((contact) => {
                    window.open(
                      contact.whatsappHref,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  });
                }}
              >
                <ChannelInner
                  icon={WhatsappIcon}
                  label="WhatsApp"
                  display={pending ? "Chargement…" : "M'écrire sur WhatsApp"}
                />
              </button>
            )}
          </li>
        ) : null}

        {otherChannels.map((channel) => (
          <li key={channel.id}>
            <ChannelLink channel={channel} />
          </li>
        ))}
      </ul>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChannelLink({ channel }: { channel: PublicContactChannel }) {
  const Icon = channelIcons[channel.id];
  const isExternal = channel.href.startsWith("http");

  return (
    <ChannelAnchor
      href={channel.href}
      label={channel.label}
      display={channel.display}
      icon={Icon}
      external={isExternal}
    />
  );
}

function ChannelAnchor({
  href,
  label,
  display,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  display: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={`${label} : ${display}`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : undefined)}
      className={cardClassName}
    >
      <ChannelInner icon={icon} label={label} display={display} />
    </a>
  );
}

function ChannelInner({
  icon: Icon,
  label,
  display,
}: {
  icon: ComponentType<{ className?: string }>;
  label: ReactNode;
  display: ReactNode;
}) {
  return (
    <>
      <span className="bg-muted inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground truncate">{display}</span>
      </span>
    </>
  );
}
