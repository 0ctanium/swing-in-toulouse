import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

type Options = Omit<RenderOptions, "wrapper">;

export function renderWithProviders(ui: ReactElement, options?: Options) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
