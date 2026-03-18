import { db } from "@/lib/db";
import { sanitizeRichTextHtml } from "@/lib/html";
import { matchesUserScope } from "@/lib/user-scope";
import type { Section } from "@/features/home/types";

export function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/\"/g, "&quot;")
    .replaceAll(/'/g, "&#039;");
}

export function sortSectionsByPriority<T extends Section>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;

    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return bTime - aTime;
  });
}

export function filterSectionsBySearch<T extends Section>(sections: T[], search: string): T[] {
  if (!search.trim()) {
    return sortSectionsByPriority(sections);
  }

  const query = search.toLowerCase();
  const filtered = sections.filter((section) => {
    const title = section.title?.toLowerCase() ?? "";
    const contentText = htmlToPlainText(section.content).toLowerCase();
    return title.includes(query) || contentText.includes(query);
  });

  return sortSectionsByPriority(filtered);
}

export async function copyRichSectionToClipboard(title: string, html: string): Promise<void> {
  try {
    const htmlWithHeader = `<h3 style="margin:0 0 8px 0; font-weight:600;">${escapeHtml(title)}</h3>${sanitizeRichTextHtml(html)}`;
    const blob = new Blob([htmlWithHeader], { type: "text/html" });
    const item = new ClipboardItem({ "text/html": blob });
    await navigator.clipboard.write([item]);
  } catch {
    await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
  }
}

export async function copyPlainSectionToClipboard(title: string, html: string): Promise<void> {
  await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
}

export async function exportAllData(userId?: string): Promise<void> {
  try {
    const allSections = await db.sections.toArray();
    const userSections = allSections.filter((section) => matchesUserScope(section.userId, userId));

    const exportData = {
      sections: userSections,
      timestamp: new Date().toISOString(),
      version: "1.1",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `vetblurbs-backup-${new Date().toISOString().split("T")[0]}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed. Please try again.");
  }
}

export async function importData(userId?: string): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error("Invalid backup file format");
      }

      for (const section of data.sections) {
        await db.sections.add({
          ...section,
          id: crypto.randomUUID(),
          userId,
          content: sanitizeRichTextHtml(typeof section.content === "string" ? section.content : ""),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      alert(`Successfully imported ${data.sections.length} sections!`);
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the file format and try again.");
    }
  };

  input.click();
}
