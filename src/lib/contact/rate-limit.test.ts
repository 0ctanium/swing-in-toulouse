import { afterEach, describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/contact/rate-limit";

describe("createRateLimiter", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });

  afterEach(() => {
    limiter.reset();
  });

  it("allows bursts up to the limit", () => {
    expect(limiter.consume("ip", 0)).toBe(true);
    expect(limiter.consume("ip", 1)).toBe(true);
    expect(limiter.consume("ip", 2)).toBe(false);
  });

  it("resets after the window", () => {
    expect(limiter.consume("ip", 0)).toBe(true);
    expect(limiter.consume("ip", 1)).toBe(true);
    expect(limiter.consume("ip", 1001)).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(limiter.consume("a", 0)).toBe(true);
    expect(limiter.consume("b", 0)).toBe(true);
    expect(limiter.consume("a", 0)).toBe(true);
    expect(limiter.consume("a", 0)).toBe(false);
    expect(limiter.consume("b", 0)).toBe(true);
  });
});
