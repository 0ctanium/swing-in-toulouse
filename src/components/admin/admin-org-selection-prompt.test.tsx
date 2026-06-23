import { describe, expect, it } from "vitest";

import { AdminOrgSelectionPrompt } from "@/components/admin/admin-org-selection-prompt";
import { renderWithProviders, screen } from "../../../tests/helpers/render";

describe("AdminOrgSelectionPrompt", () => {
  it("prompts the user to select an organization", () => {
    renderWithProviders(<AdminOrgSelectionPrompt />);

    expect(
      screen.getByRole("heading", { name: /sélectionnez une organisation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/choisissez l.organisateur à gérer/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("organization-switcher")).toBeInTheDocument();
  });
});
