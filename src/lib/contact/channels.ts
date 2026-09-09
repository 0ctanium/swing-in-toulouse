import { normalizeOrganizationWebsite } from "@/lib/organizations/urls";

export const EDITOR_EMAIL = "mail@benjaminlepas.fr";
export const EDITOR_NAME = "Benjamin Lepas-Garguilo";
export const EDITOR_INSTAGRAM = "https://instagram.com/benjamin.lepas";
export const EDITOR_FACEBOOK = "https://www.facebook.com/benjamin.lepas.3";

export const DEFAULT_WHATSAPP_TEXT =
  "Bonjour Benjamin, je vous contacte depuis Swingin Toulouse.";

export type PublicContactChannelId =
  | "email"
  | "instagram"
  | "facebook";

export type PublicContactChannel = {
  id: PublicContactChannelId;
  label: string;
  href: string;
  display: string;
};

export type PublicContactConfig = {
  email: string;
  instagram?: string | null;
  facebook?: string | null;
};

export const defaultPublicContactConfig: PublicContactConfig = {
  email: EDITOR_EMAIL,
  instagram: EDITOR_INSTAGRAM,
  facebook: EDITOR_FACEBOOK,
};

export function instagramHandleFromUrl(url: string) {
  const handle = url.match(/instagram\.com\/([^/?#]+)/i)?.[1];
  return handle ? `@${handle}` : "Instagram";
}

export function listPublicContactChannels(
  config: PublicContactConfig = defaultPublicContactConfig,
): PublicContactChannel[] {
  const channels: PublicContactChannel[] = [
    {
      id: "email",
      label: "Email",
      href: `mailto:${config.email}`,
      display: config.email,
    },
  ];

  const instagram = normalizeOrganizationWebsite(config.instagram);
  if (instagram) {
    channels.push({
      id: "instagram",
      label: "Instagram",
      href: instagram,
      display: instagramHandleFromUrl(instagram),
    });
  }

  const facebook = normalizeOrganizationWebsite(config.facebook);
  if (facebook) {
    channels.push({
      id: "facebook",
      label: "Facebook",
      href: facebook,
      display: "Profil Facebook",
    });
  }

  return channels;
}
