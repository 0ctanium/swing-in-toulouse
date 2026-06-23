import { describe, expect, it } from "vitest";

import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { renderWithProviders, screen } from "../../../tests/helpers/render";

describe("AdminEventActions", () => {
  it("renders nothing without admin metadata", () => {
    const { container } = renderWithProviders(
      <AdminEventActions masterEventId="event-1" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links to the admin edit page", () => {
    renderWithProviders(
      <AdminEventActions
        masterEventId="event-123"
        admin={{
          overrideCount: 0,
          masterOverridden: false,
          occurrenceOverridden: false,
        }}
      />,
    );

    const link = screen.getByRole("link", { name: /corriger/i });
    expect(link).toHaveAttribute("href", "/admin/events/event-123");
  });

  it("shows override badges when present", () => {
    renderWithProviders(
      <AdminEventActions
        masterEventId="event-123"
        admin={{
          overrideCount: 2,
          masterOverridden: true,
          occurrenceOverridden: true,
        }}
      />,
    );

    expect(screen.getByText("2 overrides")).toBeInTheDocument();
    expect(screen.getByText("occurrence")).toBeInTheDocument();
    expect(screen.getByText("série")).toBeInTheDocument();
  });
});
