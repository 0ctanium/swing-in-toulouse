import mockRouter from "next-router-mock";

import { mockUseAuth } from "../helpers/clerk-client-mock";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useSearchParams: () =>
    new URLSearchParams(mockRouter.query as Record<string, string>),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
  OrganizationSwitcher: () => <div data-testid="organization-switcher" />,
  UserButton: () => <div data-testid="user-button" />,
}));
