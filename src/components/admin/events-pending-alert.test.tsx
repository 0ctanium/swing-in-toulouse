import { Suspense } from "react";
import { describe, expect, it } from "vitest";

import { EventsPendingAlert } from "@/components/admin/events-pending-alert";
import {
  act,
  renderWithProviders,
  screen,
  waitFor,
} from "../../../tests/helpers/render";

async function renderAlert(pendingCount: number) {
  await act(async () => {
    renderWithProviders(
      <Suspense fallback={null}>
        <EventsPendingAlert pendingCount={Promise.resolve(pendingCount)} />
      </Suspense>,
    );
  });
}

describe("EventsPendingAlert", () => {
  it("renders nothing when the queue is empty", async () => {
    await renderAlert(0);

    await waitFor(() => {
      expect(
        screen.queryByText(/événements? à confirmer/i),
      ).not.toBeInTheDocument();
    });
  });

  it("links to the confirmation queue", async () => {
    await renderAlert(3);

    expect(
      await screen.findByText("3 événements à confirmer"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ouvrir la file de confirmation/i }),
    ).toHaveAttribute("href", "/admin/events/confirm");
  });
});
