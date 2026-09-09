import { z } from "zod";

import { normalizePhoneNumber } from "./phone";

export const CONTACT_TOPICS = [
  { value: "erreur", label: "Une erreur dans l'agenda" },
  { value: "ajout", label: "Ajouter un événement ou une source" },
  { value: "question", label: "Une question" },
  { value: "autre", label: "Autre" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

const contactTopicValues = CONTACT_TOPICS.map((topic) => topic.value) as [
  ContactTopic,
  ...ContactTopic[],
];

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom (2 caractères minimum).")
    .max(120, "Le nom est trop long."),
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre email.")
    .email("Email invalide."),
  phone: z
    .string()
    .trim()
    .min(1, "Indiquez votre numéro de téléphone.")
    .refine((value) => normalizePhoneNumber(value) !== null, {
      message: "Numéro de téléphone invalide.",
    })
    .transform((value) => normalizePhoneNumber(value)!),
  organization: z
    .string()
    .trim()
    .max(160, "Le nom d'organisation est trop long.")
    .optional(),
  topic: z.enum(contactTopicValues),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit faire au moins 10 caractères.")
    .max(4000, "Le message est trop long (4000 caractères max)."),
  page: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine(
      (value) => !value || value.startsWith("/"),
      "Page de contexte invalide.",
    ),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

export function parseContactFormData(formData: FormData) {
  const organization = String(formData.get("organization") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim();

  return contactMessageSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    organization: organization || undefined,
    topic: String(formData.get("topic") ?? ""),
    message: String(formData.get("message") ?? ""),
    page: page || undefined,
  });
}

export function contactTopicLabel(topic: ContactTopic) {
  return CONTACT_TOPICS.find((item) => item.value === topic)?.label ?? topic;
}

/** Honeypot: bots often fill every field. Humans never see it. */
export function isHoneypotFilled(formData: FormData) {
  return String(formData.get("website") ?? "").trim().length > 0;
}
