import Dexie, { Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { sanitizeRichTextHtml } from "@/lib/html";
import { matchesUserScope } from "@/lib/user-scope";

export type CollectionKey =
  | "exams"
  | "medications"
  | "dischargeTemplates"
  | "diseaseTemplates"
  | "recommendations"
  | "handouts"
  | "blurbs"
  | "monitoring";

export type DbSection = {
  id: string;
  collection: CollectionKey;
  title: string;
  content: string;
  isPublic?: boolean;
  isStarred?: boolean;
  createdAt: number;
  updatedAt: number;
  userId?: string;
};

export type WorkspaceItem = {
  id: string;
  title: string;
  html: string;
  text: string;
  order: number;
  createdAt: number;
  userId?: string;
};

class VetDB extends Dexie {
  sections!: Table<DbSection, string>;
  workspaceItems!: Table<WorkspaceItem, string>;
  handouts!: Table<Handout, string>;
  scratchpads!: Table<Scratchpad, string>;
  constructor() {
    super("vet-discharge-db");
    this.version(1).stores({
      // Indexes: primary key id, and secondary indexes for queries
      sections: "id, collection, title, createdAt, updatedAt, userId",
    });
    this.version(2).stores({
      workspaceItems: "id, createdAt, order, userId",
    });
    this.version(3).stores({
      handouts: "id, createdAt, name, type, size, userId",
    });
    this.version(4).stores({
      scratchpads: "id, userId, updatedAt",
    });
  }
}

export const db = new VetDB();

export function useSectionsByCollection(collection: CollectionKey, userId?: string): DbSection[] {
  const items = useLiveQuery(async () => {
    let rows = await db.sections.where("collection").equals(collection).toArray();
    rows = rows.filter((r) => matchesUserScope(r.userId, userId));
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [collection, userId], [] as DbSection[]);
  return items ?? [];
}

export function useStarredSections(userId?: string): DbSection[] {
  const items = useLiveQuery(async () => {
    let rows = await db.sections.filter((section) => section.isStarred === true).toArray();
    rows = rows.filter((r) => matchesUserScope(r.userId, userId));
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [userId], [] as DbSection[]);
  return items ?? [];
}

export async function addSection(collection: CollectionKey, userId?: string, isPublic: boolean = false): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.sections.add({
    id,
    collection,
    title: "Untitled",
    content: "",
    isPublic,
    createdAt: now,
    updatedAt: now,
    userId,
  });
  return id;
}

export async function updateSection(
  id: string,
  partial: Partial<Pick<DbSection, "title" | "content" | "collection" | "isPublic" | "isStarred">>
): Promise<number> {
  return db.sections.update(id, { ...partial, updatedAt: Date.now() });
}

export async function deleteSection(id: string): Promise<void> {
  await db.sections.delete(id);
}

// Workspace helpers
export function useWorkspaceItems(userId?: string): WorkspaceItem[] {
  const items = useLiveQuery(async () => {
    let rows = await db.workspaceItems.toArray();
    rows = rows.filter((r) => matchesUserScope(r.userId, userId));
    return rows.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }, [userId], [] as WorkspaceItem[]);
  return items ?? [];
}

export async function addWorkspaceItem(params: { title: string; html?: string; text?: string; userId?: string }): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const rows = await db.workspaceItems.toArray();
  const count = rows.filter((row) => matchesUserScope(row.userId, params.userId)).length;
  const safeHtml = sanitizeRichTextHtml(params.html ?? "");
  const text = params.text ?? stripHtml(safeHtml);
  const html = safeHtml || escapeHtmlForHtmlBlock(text);
  await db.workspaceItems.add({
    id,
    title: params.title || "Untitled",
    html,
    text,
    order: count,
    createdAt: now,
    userId: params.userId,
  });
  return id;
}

export async function removeWorkspaceItem(id: string): Promise<void> {
  await db.workspaceItems.delete(id);
}

export async function clearWorkspace(userId?: string): Promise<void> {
  const rows = await db.workspaceItems.toArray();
  const ids = rows
    .filter((row) => matchesUserScope(row.userId, userId))
    .map((row) => row.id);

  if (ids.length > 0) {
    await db.workspaceItems.bulkDelete(ids);
  }
}

export async function reorderWorkspace(idsInOrder: string[]): Promise<void> {
  await db.transaction('rw', db.workspaceItems, async () => {
    for (let i = 0; i < idsInOrder.length; i += 1) {
      const id = idsInOrder[i];
      await db.workspaceItems.update(id, { order: i });
    }
  });
}

// Utilities
function stripHtml(html: string): string {
  const div = globalThis.document ? document.createElement('div') : null;
  if (!div) return html;
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function escapeHtmlForHtmlBlock(text: string): string {
  return text
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/\"/g, "&quot;")
    .replaceAll(/'/g, "&#039;")
    .replace(/\n/g, '<br/>');
}

// Handouts (file uploads)
export type Handout = {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
  userId?: string;
};

export function useHandouts(userId?: string): Handout[] {
  const items = useLiveQuery(async () => {
    let rows = await db.handouts.toArray();
    rows = rows.filter((r) => matchesUserScope(r.userId, userId));
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  }, [userId], [] as Handout[]);
    
  return items ?? [];
}

export async function addHandoutFromFile(file: File, userId?: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const blob = file.slice(0, file.size, file.type || "application/octet-stream");
  await db.handouts.add({
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    blob,
    createdAt: now,
    userId,
  });
  return id;
}

export async function deleteHandout(id: string): Promise<void> {
  await db.handouts.delete(id);
}

// Scratchpad (persistent free-form text)
export type Scratchpad = {
  id: string; // "scratchpad:<user>"
  userId?: string;
  html: string;
  updatedAt: number;
};

function scratchpadId(userId?: string): string {
  return `scratchpad:${userId ?? "guest"}`;
}

export function useScratchpadHtml(userId?: string): string {
  const id = scratchpadId(userId);
  const row = useLiveQuery(async () => {
    return (await db.scratchpads.get(id)) ?? null;
  }, [id], null as Scratchpad | null);
  return row?.html ?? "";
}

export async function saveScratchpadHtml(userId: string | undefined, html: string): Promise<void> {
  const id = scratchpadId(userId);
  const now = Date.now();
  const safeHtml = sanitizeRichTextHtml(html);
  const existing = await db.scratchpads.get(id);
  if (existing) {
    await db.scratchpads.update(id, { html: safeHtml, updatedAt: now });
  } else {
    await db.scratchpads.add({ id, userId, html: safeHtml, updatedAt: now });
  }
}


