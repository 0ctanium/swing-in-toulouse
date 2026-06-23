import { describe, expect, it } from "vitest";

import { EventsPendingAlert } from "@/components/admin/events-pending-alert";
import { renderWithProviders, screen } from "../../../tests/helpers/render";

describe("EventsPendingAlert", () => {
  it("renders nothing when the queue is empty", () => {
    const { container } = renderWithProviders(
      <EventsPendingAlert pendingCount={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links to the confirmation queue", () => {
    renderWithProviders(<EventsPendingAlert pendingCount={3} />);

    expect(screen.getByText("3 événements à confirmer")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ouvrir la file de confirmation/i }),
    ).toHaveAttribute("href", "/admin/events/confirm");
  });
});
