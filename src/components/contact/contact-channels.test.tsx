import { describe, expect, it, vi } from "vitest";

import { ContactChannels } from "@/components/contact/contact-channels";
import { renderWithProviders, screen, userEvent } from "../../../tests/helpers/render";

vi.mock("@/app/contact/actions", () => ({
  revealEditorPhone: vi.fn(async () => ({
    status: "ok",
    contact: {
      phoneDisplay: "06 48 43 60 20",
      phoneHref: "tel:+33648436020",
      whatsappHref: "https://wa.me/33648436020",
    },
  })),
}));

describe("ContactChannels", () => {
  it("renders nothing without channels or phone reveal", () => {
    const { container } = renderWithProviders(
      <ContactChannels channels={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders email without exposing a phone number", () => {
    const { container } = renderWithProviders(
      <ContactChannels
        canRevealPhone
        channels={[
          {
            id: "email",
            label: "Email",
            href: "mailto:mail@benjaminlepas.fr",
            display: "mail@benjaminlepas.fr",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: /email : mail@benjaminlepas.fr/i }),
    ).toHaveAttribute("href", "mailto:mail@benjaminlepas.fr");
    expect(
      screen.getByRole("button", { name: /afficher le numéro de téléphone/i }),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("06 48 43 60 20");
    expect(container.innerHTML).not.toContain("33648436020");
    expect(container.innerHTML).not.toContain("wa.me");
  });

  it("reveals the phone after a click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ContactChannels
        canRevealPhone
        channels={[
          {
            id: "email",
            label: "Email",
            href: "mailto:mail@benjaminlepas.fr",
            display: "mail@benjaminlepas.fr",
          },
        ]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /afficher le numéro de téléphone/i }),
    );

    expect(
      await screen.findByRole("link", { name: /téléphone : 06 48 43 60 20/i }),
    ).toHaveAttribute("href", "tel:+33648436020");
  });
});
