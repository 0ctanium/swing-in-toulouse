"use server";

import { headers } from "next/headers";

import { clientIpFromHeaders } from "@/lib/contact/client-ip";
import type { EditorDirectContact } from "@/lib/contact/direct-contact";
import { getEditorDirectContact } from "@/lib/contact/editor";
import { isContactEmailConfigured, notifyContactMessage } from "@/lib/contact/notify";
import {
  contactRateLimiter,
  phoneRevealRateLimiter,
} from "@/lib/contact/rate-limit";
import {
  isHoneypotFilled,
  parseContactFormData,
} from "@/lib/contact/schema";

export type ContactActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export type RevealPhoneState =
  | { status: "ok"; contact: EditorDirectContact }
  | { status: "error"; message: string };

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  if (isHoneypotFilled(formData)) {
    return { status: "success" };
  }

  const parsed = parseContactFormData(formData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      status: "error",
      message: firstIssue?.message ?? "Vérifiez le formulaire.",
    };
  }

  const headerList = await headers();
  const allowed = contactRateLimiter.consume(clientIpFromHeaders(headerList));
  if (!allowed) {
    return {
      status: "error",
      message:
        "Trop de messages en peu de temps. Réessayez dans quelques minutes, ou écrivez-moi directement.",
    };
  }

  if (!isContactEmailConfigured()) {
    return {
      status: "error",
      message:
        "Le formulaire n'est pas encore branché. Utilisez l'email ci-dessus, ou un autre moyen de contact s'il est affiché.",
    };
  }

  try {
    await notifyContactMessage(parsed.data);
  } catch (error) {
    console.error("Contact notification failed", error);
    return {
      status: "error",
      message:
        "L'envoi a échoué. Réessayez, ou contactez-moi par email / WhatsApp.",
    };
  }

  return { status: "success" };
}

export async function revealEditorPhone(): Promise<RevealPhoneState> {
  const headerList = await headers();
  const allowed = phoneRevealRateLimiter.consume(
    clientIpFromHeaders(headerList),
  );

  if (!allowed) {
    return {
      status: "error",
      message: "Trop de demandes. Réessayez dans quelques minutes.",
    };
  }

  const contact = getEditorDirectContact();
  if (!contact) {
    return {
      status: "error",
      message: "Le numéro n'est pas disponible pour le moment.",
    };
  }

  return { status: "ok", contact };
}
