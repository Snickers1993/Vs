import { describe, it, expect } from "vitest";
import { matchesUserScope } from "@/lib/user-scope";

describe("matchesUserScope", () => {
  it("returns true when activeUserId matches recordUserId", () => {
    expect(matchesUserScope("user1", "user1")).toBe(true);
  });

  it("returns false when activeUserId does not match recordUserId", () => {
    expect(matchesUserScope("user1", "user2")).toBe(false);
  });

  it("returns true for guest when record has no userId", () => {
    expect(matchesUserScope(undefined, undefined)).toBe(true);
  });

  it("returns false for guest when record has a userId", () => {
    expect(matchesUserScope("user1", undefined)).toBe(false);
  });

  it("returns false when activeUserId is set but record has no userId", () => {
    expect(matchesUserScope(undefined, "user1")).toBe(false);
  });

  it("returns true for empty string activeUserId matching empty string recordUserId", () => {
    expect(matchesUserScope("", "")).toBe(true);
  });
});
