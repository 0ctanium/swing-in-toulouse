import { beforeEach, describe, expect, it } from "vitest";

import mockRouter from "next-router-mock";

import { AdminModeBanner } from "@/components/admin/admin-mode-banner";
import { mockUseAuth } from "../../../tests/helpers/clerk-client-mock";
import { renderWithProviders, screen } from "../../../tests/helpers/render";

describe("AdminModeBanner", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/agenda");
  });

  it("is hidden on admin pages", () => {
    mockRouter.setCurrentUrl("/admin/events");
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      userId: "user_1",
      orgId: "org_1",
      sessionClaims: { metadata: { role: "admin" } },
    });

    const { container } = renderWithProviders(<AdminModeBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden for signed-out users", () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      userId: null,
      orgId: null,
      sessionClaims: null,
    });

    const { container } = renderWithProviders(<AdminModeBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows for org members on public pages", () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      userId: "user_1",
      orgId: "org_1",
      sessionClaims: {},
    });

    renderWithProviders(<AdminModeBanner />);

    expect(screen.getByText(/mode admin actif/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByTestId("organization-switcher")).toBeInTheDocument();
  });

  it("shows for platform admins without an active org", () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      userId: "user_admin",
      orgId: null,
      sessionClaims: { metadata: { role: "admin" } },
    });

    renderWithProviders(<AdminModeBanner />);

    expect(screen.getByText(/mode admin actif/i)).toBeInTheDocument();
  });
});
