import { Resend } from "resend";

import { env } from "@/env";
import { siteConfig } from "@/lib/site";

import { EDITOR_EMAIL } from "./channels";
import { getEditorPhoneE164 } from "./editor";
import { escapeHtml, escapeHtmlMultiline } from "./html";
import { normalizePhoneNumber } from "./phone";
import { contactTopicLabel, type ContactMessage } from "./schema";

const WHATSAPP_GRAPH_VERSION = "v22.0";

export type ContactNotifyResult = {
  emailId: string;
  whatsappSent: boolean;
};

export type WhatsappCloudPayload = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
};

function defaultFromAddress() {
  return env.CONTACT_EMAIL_FROM ?? `${siteConfig.name} <contact@swing-toulouse.fr>`;
}

function notifyPhone() {
  return normalizePhoneNumber(env.CONTACT_NOTIFY_PHONE) ?? getEditorPhoneE164();
}

export function isContactEmailConfigured() {
  return Boolean(env.RESEND_API_KEY);
}

export function isWhatsappNotifyConfigured() {
  return Boolean(
    env.WHATSAPP_ACCESS_TOKEN &&
      env.WHATSAPP_PHONE_NUMBER_ID &&
      env.WHATSAPP_TEMPLATE_NAME &&
      notifyPhone(),
  );
}

export function buildContactEmail(message: ContactMessage) {
  const topic = contactTopicLabel(message.topic);
  const subject = `[Contact] ${topic} — ${message.name}`;
  const pageLine = message.page
    ? `${siteConfig.url}${message.page}`
    : "Non précisée";
  const organizationLine = message.organization ?? "Non précisée";

  const text = [
    `Nouveau message via ${siteConfig.name}`,
    "",
    `Sujet : ${topic}`,
    `Nom : ${message.name}`,
    `Email : ${message.email}`,
    `Organisation : ${organizationLine}`,
    `Page : ${pageLine}`,
    "",
    message.message,
  ].join("\n");

  const html = `
    <p>Nouveau message via <strong>${escapeHtml(siteConfig.name)}</strong></p>
    <ul>
      <li><strong>Sujet :</strong> ${escapeHtml(topic)}</li>
      <li><strong>Nom :</strong> ${escapeHtml(message.name)}</li>
      <li><strong>Email :</strong> ${escapeHtml(message.email)}</li>
      <li><strong>Organisation :</strong> ${escapeHtml(organizationLine)}</li>
      <li><strong>Page :</strong> ${escapeHtml(pageLine)}</li>
    </ul>
    <p>${escapeHtmlMultiline(message.message)}</p>
  `.trim();

  return {
    from: defaultFromAddress(),
    to: env.CONTACT_EMAIL_TO ?? EDITOR_EMAIL,
    replyTo: message.email,
    subject,
    text,
    html,
  };
}

/** Message body for WhatsApp template variable {{4}} (newlines flattened). */
export function buildContactNotifyPreview(message: ContactMessage) {
  return sanitizeWhatsappTemplateParam(
    message.message.replace(/\s+/g, " "),
    1024,
  );
}

/** WhatsApp template variables reject newlines, tabs, empty values, and 4+ spaces. */
export function sanitizeWhatsappTemplateParam(value: string, maxLength = 120) {
  const compact = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim()
    .slice(0, maxLength)
    .trim();

  return compact.length > 0 ? compact : "—";
}

export function buildWhatsappCloudPayload(
  message: ContactMessage,
  to: string,
  templateName: string,
  language: string,
): WhatsappCloudPayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: sanitizeWhatsappTemplateParam(message.name, 60),
            },
            {
              type: "text",
              text: sanitizeWhatsappTemplateParam(
                contactTopicLabel(message.topic),
                80,
              ),
            },
            {
              type: "text",
              text: sanitizeWhatsappTemplateParam(message.email, 80),
            },
            {
              type: "text",
              text: buildContactNotifyPreview(message),
            },
          ],
        },
      ],
    },
  };
}

async function sendResendEmail(message: ContactMessage) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const payload = buildContactEmail(message);
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from: payload.from,
      to: [payload.to],
      replyTo: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    },
    { idempotencyKey: `contact-form/${crypto.randomUUID()}` },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email id");
  }

  return data.id;
}

async function sendWhatsappNotification(message: ContactMessage) {
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = env.WHATSAPP_TEMPLATE_NAME;
  const to = notifyPhone();

  if (!token || !phoneNumberId || !templateName || !to) {
    return false;
  }

  const payload = buildWhatsappCloudPayload(
    message,
    to,
    templateName,
    env.WHATSAPP_TEMPLATE_LANGUAGE ?? "fr",
  );

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("WhatsApp Cloud API message failed", response.status, details);
    return false;
  }

  return true;
}

export async function notifyContactMessage(
  message: ContactMessage,
): Promise<ContactNotifyResult> {
  const emailId = await sendResendEmail(message);
  const whatsappSent = await sendWhatsappNotification(message).catch(
    (error: unknown) => {
      console.error("WhatsApp notification failed", error);
      return false;
    },
  );

  return { emailId, whatsappSent };
}
