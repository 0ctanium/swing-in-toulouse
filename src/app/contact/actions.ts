"use server";

import { headers } from "next/headers";

import { clientIpFromHeaders } from "@/lib/contact/client-ip";
import { isContactEmailConfigured, notifyContactMessage } from "@/lib/contact/notify";
import { contactRateLimiter } from "@/lib/contact/rate-limit";
import {
  isHoneypotFilled,
  parseContactFormData,
} from "@/lib/contact/schema";

export type ContactActionState =
  | { status: "idle" }
  | { status: "success" }
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
        "Trop de messages en peu de temps. Réessayez dans quelques minutes.",
    };
  }

  if (!isContactEmailConfigured()) {
    return {
      status: "error",
      message: "Le formulaire n'est pas encore branché. Réessayez plus tard.",
    };
  }

  try {
    await notifyContactMessage(parsed.data);
  } catch (error) {
    console.error("Contact notification failed", error);
    return {
      status: "error",
      message: "L'envoi a échoué. Réessayez dans quelques minutes.",
    };
  }

  return { status: "success" };
}
