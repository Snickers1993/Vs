import Dexie, { Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

export type CollectionKey =
  | "medications"
  | "dischargeTemplates"
  | "diseaseTemplates"
  | "recommendations"
  | "handouts"
  | "blurbs";

export type DbSection = {
  id: string;
  collection: CollectionKey;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceItem = {
  id: string;
  title: string;
  html: string;
  text: string;
  order: number;
  createdAt: number;
};

class VetDB extends Dexie {
  sections!: Table<DbSection, string>;
  workspaceItems!: Table<WorkspaceItem, string>;
  handouts!: Table<Handout, string>;
  constructor() {
    super("vet-discharge-db");
    this.version(1).stores({
      // Indexes: primary key id, and secondary indexes for queries
      sections: "id, collection, title, createdAt, updatedAt",
    });
    this.version(2).stores({
      workspaceItems: "id, createdAt, order",
    });
    this.version(3).stores({
      handouts: "id, createdAt, name, type, size",
    });
  }
}

export const db = new VetDB();

export function useSectionsByCollection(collection: CollectionKey): DbSection[] {
  const items = useLiveQuery(async () => {
    const rows = await db.sections.where("collection").equals(collection).toArray();
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [collection], [] as DbSection[]);
  return items ?? [];
}

export async function addSection(collection: CollectionKey): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.sections.add({
    id,
    collection,
    title: "Untitled",
    content: "",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateSection(
  id: string,
  partial: Partial<Pick<DbSection, "title" | "content" | "collection">>
): Promise<number> {
  return db.sections.update(id, { ...partial, updatedAt: Date.now() });
}

export async function deleteSection(id: string): Promise<void> {
  await db.sections.delete(id);
}

// Workspace helpers
export function useWorkspaceItems(): WorkspaceItem[] {
  const items = useLiveQuery(async () => {
    const rows = await db.workspaceItems.toArray();
    return rows.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }, [], [] as WorkspaceItem[]);
  return items ?? [];
}

export async function addWorkspaceItem(params: { title: string; html?: string; text?: string }): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const count = await db.workspaceItems.count();
  const text = params.text ?? stripHtml(params.html ?? "");
  const html = params.html ?? escapeHtmlForHtmlBlock(text);
  await db.workspaceItems.add({
    id,
    title: params.title || "Untitled",
    html,
    text,
    order: count,
    createdAt: now,
  });
  return id;
}

export async function removeWorkspaceItem(id: string): Promise<void> {
  await db.workspaceItems.delete(id);
}

export async function clearWorkspace(): Promise<void> {
  await db.workspaceItems.clear();
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
};

export function useHandouts(): Handout[] {
  const items = useLiveQuery(async () => {
    const rows = await db.handouts.toArray();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  }, [], [] as Handout[]);
    
  return items ?? [];
}

export async function addHandoutFromFile(file: File): Promise<string> {
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
  });
  return id;
}

export async function deleteHandout(id: string): Promise<void> {
  await db.handouts.delete(id);
}


