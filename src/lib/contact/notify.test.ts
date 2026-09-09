import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { escapeHtml, escapeHtmlMultiline } from "@/lib/contact/html";
import {
  buildContactEmail,
  buildContactNotifyPreview,
  buildWhatsappCloudPayload,
  sanitizeWhatsappTemplateParam,
} from "@/lib/contact/notify";
import type { ContactMessage } from "@/lib/contact/schema";

const message: ContactMessage = {
  name: "Alice <script>",
  email: "alice@example.com",
  organization: "Swing Club",
  topic: "erreur",
  message: "Le lieu est faux.\nMerci.",
  page: "/evenement/bal",
};

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<a href="x">`)).toBe("&lt;a href=&quot;x&quot;&gt;");
  });
});

describe("buildContactEmail", () => {
  it("includes reply-to, topic and escaped HTML", () => {
    const email = buildContactEmail(message);

    expect(email.replyTo).toBe("alice@example.com");
    expect(email.subject).toContain("Une erreur dans l'agenda");
    expect(email.subject).toContain("Alice <script>");
    expect(email.html).toContain("Alice &lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("Le lieu est faux.<br />Merci.");
    expect(email.text).toContain("http://localhost:3000/evenement/bal");
    expect(email.text).toContain("Swing Club");
  });
});

describe("buildContactNotifyPreview", () => {
  it("keeps a short single-line preview", () => {
    const preview = buildContactNotifyPreview(message);
    expect(preview).toContain("Le lieu est faux. Merci.");
    expect(preview).not.toMatch(/[\r\n]/);
  });
});

describe("sanitizeWhatsappTemplateParam", () => {
  it("strips newlines and empty values", () => {
    expect(sanitizeWhatsappTemplateParam("a\n\tb")).toBe("a b");
    expect(sanitizeWhatsappTemplateParam("    ")).toBe("—");
    expect(sanitizeWhatsappTemplateParam("a".repeat(200), 10)).toBe(
      "aaaaaaaaaa",
    );
  });
});

describe("buildWhatsappCloudPayload", () => {
  it("sends a Cloud API template with name, topic and preview", () => {
    const payload = buildWhatsappCloudPayload(
      message,
      "+33648436020",
      "contact_form_alert",
      "fr",
    );

    expect(payload).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+33648436020",
      type: "template",
      template: {
        name: "contact_form_alert",
        language: { code: "fr" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Alice <script>" },
              { type: "text", text: "Une erreur dans l'agenda" },
              { type: "text", text: "Le lieu est faux. Merci." },
            ],
          },
        ],
      },
    });
  });
});

describe("escapeHtmlMultiline", () => {
  it("turns newlines into br tags after escaping", () => {
    expect(escapeHtmlMultiline("a\nb")).toBe("a<br />b");
  });
});
