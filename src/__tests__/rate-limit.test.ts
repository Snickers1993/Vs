import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the rate limiter by advancing time past the window
    vi.useFakeTimers();
    vi.advanceTimersByTime(120_000);
    vi.useRealTimers();
  });

  it("allows the first request", () => {
    vi.useFakeTimers();
    expect(checkRateLimit("test-first")).toBe(true);
    vi.useRealTimers();
  });

  it("allows up to 5 requests in the same window", () => {
    vi.useFakeTimers();
    const key = "test-five-" + Date.now();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key)).toBe(true);
    }
    vi.useRealTimers();
  });

  it("blocks the 6th request in the same window", () => {
    vi.useFakeTimers();
    const key = "test-block-" + Date.now();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key)).toBe(false);
    vi.useRealTimers();
  });

  it("resets after the time window expires", () => {
    vi.useFakeTimers();
    const key = "test-reset-" + Date.now();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key)).toBe(false);

    // Advance past the 60-second window
    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit(key)).toBe(true);
    vi.useRealTimers();
  });

  it("tracks different keys independently", () => {
    vi.useFakeTimers();
    const now = Date.now();
    const key1 = "user-a-" + now;
    const key2 = "user-b-" + now;

    for (let i = 0; i < 5; i++) {
      checkRateLimit(key1);
    }
    expect(checkRateLimit(key1)).toBe(false);
    expect(checkRateLimit(key2)).toBe(true);
    vi.useRealTimers();
  });
});
