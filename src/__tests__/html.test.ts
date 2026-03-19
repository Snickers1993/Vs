import { describe, it, expect } from "vitest";
import { sanitizeRichTextHtml } from "@/lib/html";

describe("sanitizeRichTextHtml", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeRichTextHtml("")).toBe("");
  });

  it("returns empty string for falsy input", () => {
    expect(sanitizeRichTextHtml(null as unknown as string)).toBe("");
  });

  it("preserves safe HTML tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeRichTextHtml(input)).toBe(input);
  });

  it("preserves italic and underline tags", () => {
    const input = "<em>italic</em> <u>underline</u>";
    expect(sanitizeRichTextHtml(input)).toBe(input);
  });

  it("preserves list elements", () => {
    const input = "<ul><li>item 1</li><li>item 2</li></ul>";
    expect(sanitizeRichTextHtml(input)).toBe(input);
  });

  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeRichTextHtml(input)).not.toContain("<script>");
    expect(sanitizeRichTextHtml(input)).toContain("<p>Hello</p>");
  });

  it("strips event handler attributes", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Click me");
  });

  it("strips iframe tags", () => {
    const input = '<iframe src="http://evil.com"></iframe><p>Safe</p>';
    expect(sanitizeRichTextHtml(input)).not.toContain("<iframe");
    expect(sanitizeRichTextHtml(input)).toContain("<p>Safe</p>");
  });

  it("strips javascript: URLs from links", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeRichTextHtml(input);
    expect(result).not.toContain("javascript:");
  });
});
