import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  htmlToPlainText,
  sortSectionsByPriority,
  filterSectionsBySearch,
} from "@/features/home/utils";
import type { Section } from "@/features/home/types";

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    content: "",
    ...overrides,
  };
}

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello\' world')).toBe("&quot;hello&#039; world");
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("handles multiple special characters", () => {
    expect(escapeHtml('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
  });
});

describe("htmlToPlainText", () => {
  it("strips HTML tags", () => {
    expect(htmlToPlainText("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("returns empty string for empty HTML", () => {
    expect(htmlToPlainText("")).toBe("");
  });

  it("handles plain text input", () => {
    expect(htmlToPlainText("just text")).toBe("just text");
  });

  it("handles nested tags", () => {
    expect(htmlToPlainText("<div><p><em>nested</em></p></div>")).toBe("nested");
  });
});

describe("sortSectionsByPriority", () => {
  it("puts starred sections first", () => {
    const a = makeSection({ title: "A", isStarred: false, updatedAt: "2026-01-02" });
    const b = makeSection({ title: "B", isStarred: true, updatedAt: "2026-01-01" });
    const result = sortSectionsByPriority([a, b]);
    expect(result[0].title).toBe("B");
    expect(result[1].title).toBe("A");
  });

  it("sorts by updatedAt descending within same starred status", () => {
    const a = makeSection({ title: "Older", updatedAt: "2026-01-01" });
    const b = makeSection({ title: "Newer", updatedAt: "2026-01-05" });
    const result = sortSectionsByPriority([a, b]);
    expect(result[0].title).toBe("Newer");
    expect(result[1].title).toBe("Older");
  });

  it("does not mutate the original array", () => {
    const sections = [
      makeSection({ title: "A", updatedAt: "2026-01-01" }),
      makeSection({ title: "B", updatedAt: "2026-01-05" }),
    ];
    const result = sortSectionsByPriority(sections);
    expect(result).not.toBe(sections);
  });

  it("handles sections without updatedAt by falling back to createdAt", () => {
    const a = makeSection({ title: "A", createdAt: "2026-01-01" });
    const b = makeSection({ title: "B", createdAt: "2026-01-05" });
    const result = sortSectionsByPriority([a, b]);
    expect(result[0].title).toBe("B");
  });

  it("returns empty array for empty input", () => {
    expect(sortSectionsByPriority([])).toEqual([]);
  });
});

describe("filterSectionsBySearch", () => {
  const sections = [
    makeSection({ title: "Antibiotics protocol", content: "<p>Amoxicillin 10mg/kg</p>" }),
    makeSection({ title: "Pain management", content: "<p>Meloxicam 0.2mg/kg</p>" }),
    makeSection({ title: "Discharge general", content: "<p>Follow up in 2 weeks</p>" }),
  ];

  it("returns all sections sorted when search is empty", () => {
    const result = filterSectionsBySearch(sections, "");
    expect(result).toHaveLength(3);
  });

  it("returns all sections sorted when search is whitespace", () => {
    const result = filterSectionsBySearch(sections, "   ");
    expect(result).toHaveLength(3);
  });

  it("filters by title match (case-insensitive)", () => {
    const result = filterSectionsBySearch(sections, "antibiotics");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Antibiotics protocol");
  });

  it("filters by content match", () => {
    const result = filterSectionsBySearch(sections, "meloxicam");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Pain management");
  });

  it("returns empty array when no match", () => {
    const result = filterSectionsBySearch(sections, "xyznotfound");
    expect(result).toHaveLength(0);
  });
});
