import "server-only";

import { env } from "@/env";

import { DEFAULT_WHATSAPP_TEXT } from "./channels";
import type { EditorDirectContact } from "./direct-contact";
import {
  formatPhoneForDisplay,
  normalizePhoneNumber,
  whatsappMeUrl,
} from "./phone";

export type { EditorDirectContact };

/** Server-only fallback so the reveal action works without extra env. */
const FALLBACK_EDITOR_PHONE = "0648436020";

export function getEditorPhoneE164() {
  return normalizePhoneNumber(
    env.CONTACT_PHONE ?? env.CONTACT_NOTIFY_PHONE ?? FALLBACK_EDITOR_PHONE,
  );
}

export function hasEditorPhone() {
  return getEditorPhoneE164() !== null;
}

export function getEditorDirectContact(): EditorDirectContact | null {
  const phone = getEditorPhoneE164();
  if (!phone) {
    return null;
  }

  return {
    phoneDisplay: formatPhoneForDisplay(phone),
    phoneHref: `tel:${phone}`,
    whatsappHref: whatsappMeUrl(phone, DEFAULT_WHATSAPP_TEXT),
  };
}
