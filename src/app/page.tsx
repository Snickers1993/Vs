"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Plus, Copy, Trash2, ChevronDown, ChevronUp, Calculator, Download, Upload } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { type CollectionKey, useSectionsByCollection, addSection, updateSection, deleteSection, db } from "@/lib/db";
import { useSectionsApi } from "@/lib/sections";
import {
  useWorkspaceItems,
  addWorkspaceItem,
  removeWorkspaceItem,
  clearWorkspace,
} from "@/lib/db";
import { useHandouts, addHandoutFromFile, deleteHandout, useScratchpadHtml, saveScratchpadHtml } from "@/lib/db";
import { useSession, signIn } from "next-auth/react";
import AuthButtons from "@/components/AuthButtons";

type Section = {
  id: string;
  title: string;
  content: string;
  isPublic?: boolean;
};

type TabKey = CollectionKey | "fastCalculations" | "sharedBlurbs";

const DEFAULT_TABS: { key: TabKey; label: string }[] = [
  { key: "exams", label: "Exams" },
  { key: "diseaseTemplates", label: "Diseases" },
  { key: "medications", label: "Medications" },
  { key: "recommendations", label: "Recommendations" },
  { key: "blurbs", label: "Blurbs" },
  { key: "dischargeTemplates", label: "Discharge" },
  { key: "handouts", label: "Handouts" },
  { key: "fastCalculations", label: "Fast Calculations" },
  { key: "sharedBlurbs", label: "Shared Blurbs" },
];

import type { Editor } from "@tiptap/react";

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 bg-white shadow-sm">
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        Underline
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Bullets
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Numbers
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        New line
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().undo().run()}
      >
        Undo
      </button>
      <button
        className="px-2 py-1 text-sm rounded hover:bg-gray-100"
        onClick={() => editor.chain().focus().redo().run()}
      >
        Redo
      </button>
    </div>
  );
}

function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Type here…" }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-3 min-h-[180px] focus:outline-none",
      },
    },
  });

  return (
    <div className="space-y-2">
      <Toolbar editor={editor} />
      <div className="border rounded-md bg-white shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function escapeHtml(text: string): string {
  return text
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/\"/g, "&quot;")
    .replaceAll(/'/g, "&#039;");
}

// Data export/import functions
async function exportAllData(userId?: string) {
  try {
    const allSections = await db.sections.toArray();
    const userSections = userId ? allSections.filter(s => s.userId === userId) : allSections;
    
    const exportData = {
      sections: userSections,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vetblurbs-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed. Please try again.");
  }
}

async function importData(userId?: string) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error("Invalid backup file format");
      }
      
      // Import sections
      for (const section of data.sections) {
        await db.sections.add({
          ...section,
          id: crypto.randomUUID(), // Generate new ID to avoid conflicts
          userId: userId || section.userId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      
      alert(`Successfully imported ${data.sections.length} sections!`);
      window.location.reload(); // Refresh to show imported data
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the file format and try again.");
    }
  };
  input.click();
}

function useCollection(collection: CollectionKey, userId?: string) {
  // When signed in, use server API; fallback to local storage if not
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  
  const { sections: serverSections, addSectionApi, updateSectionApi, deleteSectionApi, error } = useSectionsApi(collection);
  const localSections = useSectionsByCollection(collection, userId);
  
  // Always merge local and server data when authenticated, prioritize server data for conflicts
  const sections = useMemo(() => {
    if (!isAuthenticated) {
      return localSections;
    }
    
    // Create a map of server sections by ID for quick lookup
    const serverMap = new Map(serverSections.map(s => [s.id, s]));
    
    // Start with local sections and update with server data where available
    const mergedSections = localSections.map(localSection => {
      const serverSection = serverMap.get(localSection.id);
      if (serverSection) {
        // Server data takes precedence, remove from map to avoid duplicates
        serverMap.delete(localSection.id);
        return serverSection;
      }
      return localSection;
    });
    
    // Add any remaining server sections that weren't in local data
    const remainingServerSections = Array.from(serverMap.values());
    
    // Combine and sort by updatedAt
    return [...mergedSections, ...remainingServerSections].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [isAuthenticated, serverSections, localSections]);
  
  const add = useCallback(async () => {
    if (isAuthenticated && !error) {
      try {
        return await addSectionApi({ collection });
      } catch {
        console.warn("Server API failed, falling back to local storage");
        return addSection(collection, userId);
      }
    } else {
      return addSection(collection, userId);
    }
  }, [collection, userId, isAuthenticated, error, addSectionApi]);
  
  const updateTitle = useCallback(async (id: string, title: string) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { title });
      } catch {
        console.warn("Server API failed, falling back to local storage");
        return updateSection(id, { title });
      }
    } else {
      return updateSection(id, { title });
    }
  }, [isAuthenticated, error, updateSectionApi]);
  
  const updateContent = useCallback(async (id: string, content: string) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { content });
      } catch {
        console.warn("Server API failed, falling back to local storage");
        return updateSection(id, { content });
      }
    } else {
      return updateSection(id, { content });
    }
  }, [isAuthenticated, error, updateSectionApi]);
  
  const updatePublic = useCallback(async (id: string, isPublic: boolean) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { isPublic });
      } catch {
        console.warn("Server API failed, falling back to local storage");
        return updateSection(id, { isPublic });
      }
    } else {
      return updateSection(id, { isPublic });
    }
  }, [isAuthenticated, error, updateSectionApi]);
  
  const removeById = useCallback(async (id: string) => {
    if (isAuthenticated && !error) {
      try {
        return await deleteSectionApi(id);
      } catch {
        console.warn("Server API failed, falling back to local storage");
        return deleteSection(id);
      }
    } else {
      return deleteSection(id);
    }
  }, [isAuthenticated, error, deleteSectionApi]);
  
  return { sections: sections as { id: string; title: string; content: string; isPublic?: boolean }[], add, updateTitle, updateContent, updatePublic, removeById };
}

function SectionCard({ section, onChangeTitle, onChangeContent, onCopy, onCopyText, onDelete, onTogglePublic, isPublic }: {
  section: Section;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onCopy: () => void;
  onCopyText: () => void;
  onDelete: () => void;
  onTogglePublic?: () => void;
  isPublic?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"none" | "html" | "text">("none");

  const previewText = useMemo(() => htmlToPlainText(section.content).trim(), [section.content]);

  const handleCopyHtml = async () => {
    await onCopy();
    setCopied("html");
    setTimeout(() => setCopied("none"), 1200);
  };

  const handleCopyText = async () => {
    await onCopyText();
    setCopied("text");
    setTimeout(() => setCopied("none"), 1200);
  };

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white to-gray-50 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-lg font-semibold px-2 h-9 rounded hover:bg-gray-50 focus:bg-gray-50"
          value={section.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Title"
        />
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
          onClick={handleCopyHtml}
          title="Copy to clipboard"
        >
          <Copy size={16} /> Copy
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
          onClick={handleCopyText}
          title="Copy as plain text"
        >
          Plain
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm hover:bg-red-50 text-red-600"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {onTogglePublic && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic || false}
              onChange={onTogglePublic}
              className="rounded border-gray-300"
            />
            Public
          </label>
        </div>
      )}
      {copied !== "none" && (
        <div className="text-xs text-green-700">{copied === "html" ? "Copied rich text" : "Copied plain text"}</div>
      )}

      {expanded ? (
        <div className="space-y-2">
          <RichEditor
            value={section.content}
            onChange={onChangeContent}
            placeholder="Write content…"
          />
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp size={16} /> Collapse
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className="relative w-full text-left border rounded-md bg-white p-3 text-sm text-slate-700 max-h-24 overflow-hidden hover:bg-gray-50"
            onClick={() => setExpanded(true)}
            title="Click to expand"
          >
            {previewText ? previewText : "Click to add content…"}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
            <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-slate-600 text-xs bg-white/80 px-2 py-0.5 rounded">
              Expand <ChevronDown size={14} />
            </div>
          </button>
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50 text-xs"
              onClick={() => setExpanded(true)}
              title="Edit content"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<TabKey>("medications");
  const collectionForActive: CollectionKey = useMemo(() => {
    return (active === "fastCalculations" ? "medications" : active) as CollectionKey;
  }, [active]);
  const { data: session } = useSession();
  const userId = session?.user?.email?.toLowerCase();
  const { sections, add, updateTitle, updateContent, updatePublic, removeById } = useCollection(collectionForActive, userId);
  const [search, setSearch] = useState("");

  const handleCopy = async (title: string, html: string) => {
    try {
      const htmlWithHeader = `<h3 style="margin:0 0 8px 0; font-weight:600;">${escapeHtml(title)}</h3>` + html;
      const blob = new Blob([htmlWithHeader], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
    }
  };

  const handleCopyText = async (title: string, html: string) => {
    await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter((s) => {
      const title = s.title?.toLowerCase() ?? "";
      const contentText = htmlToPlainText(s.content).toLowerCase();
      return title.includes(q) || contentText.includes(q);
    });
  }, [sections, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-5">
        

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TABS.map((t) => {
              const isActive = active === t.key;
              const isFast = t.key === "fastCalculations";
              const isShared = t.key === "sharedBlurbs";
              const base = "px-3 py-1.5 rounded-full border";
              const cls = isFast
                ? isActive
                  ? `${base} bg-amber-600 border-amber-700 text-white`
                  : `${base} bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100`
                : isShared
                ? isActive
                  ? `${base} bg-blue-600 border-blue-700 text-white`
                  : `${base} bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100`
                : isActive
                ? `${base} bg-slate-900 text-white`
                : `${base} bg-white hover:bg-gray-50`;
              return (
                <button key={t.key} className={cls} onClick={() => setActive(t.key)}>
                  {isFast && <Calculator size={16} className="mr-1 inline" />} {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => add()}
            >
              <Plus size={18} /> Add section
            </button>
            <AuthButtons />
          </div>
        </div>

        {active !== "fastCalculations" && (
          <div className="mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or content…"
              className="w-full md:w-1/2 rounded-md border bg-white px-3 py-2 outline-none ring-0 focus:border-slate-900"
            />
          </div>
        )}


        <MainWithWorkspace
          sections={filteredSections}
          updateTitle={updateTitle}
          updateContent={updateContent}
          updatePublic={updatePublic}
          removeById={removeById}
          handleCopy={handleCopy}
          handleCopyText={handleCopyText}
          active={active}
          userId={userId}
        />
        
        {/* Export/Import buttons in bottom right */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50 shadow-lg"
            onClick={() => exportAllData(userId)}
            title="Download all data"
          >
            <Download size={16} /> Export
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50 shadow-lg"
            onClick={() => importData(userId)}
            title="Upload data backup"
          >
            <Upload size={16} /> Import
          </button>
        </div>
      </div>
    </div>
  );
}

function MainWithWorkspace({
  sections,
  updateTitle,
  updateContent,
  updatePublic,
  removeById,
  handleCopy,
  handleCopyText,
  active,
  userId,
}: {
  sections: Section[];
  updateTitle: (id: string, title: string) => void;
  updateContent: (id: string, html: string) => void;
  updatePublic: (id: string, isPublic: boolean) => void;
  removeById: (id: string) => void;
  handleCopy: (title: string, html: string) => Promise<void>;
  handleCopyText: (title: string, html: string) => Promise<void>;
  active: TabKey;
  userId?: string;
}) {
  const workspace = useWorkspaceItems(userId);
  const handouts = useHandouts(userId);

  const addToWorkspace = async (s: Section) => {
    await addWorkspaceItem({ title: s.title, html: s.content, userId });
  };

  const copyAllWorkspaceRich = async () => {
    const html = workspace
      .map((w) => `<h3 style="margin:0 0 8px 0; font-weight:600;">${escapeHtml(w.title)}</h3>${w.html}`)
      .join("<hr style=\"margin:16px 0; border:none; border-top:1px solid #e5e7eb;\"/>");
    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]);
    } catch {
      await navigator.clipboard.writeText(workspace.map((w) => `${w.title}\n\n${w.text}`).join("\n\n---\n\n"));
    }
  };

  const copyAllWorkspaceText = async () => {
    await navigator.clipboard.writeText(workspace.map((w) => `${w.title}\n\n${w.text}`).join("\n\n---\n\n"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
        {active === "handouts" ? (
          <HandoutsManager handouts={handouts} />
        ) : active === "fastCalculations" ? (
          <FastCalculations />
        ) : active === "sharedBlurbs" ? (
          <SharedBlurbsManager />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sections.length === 0 && (
              <div className="col-span-full text-slate-600">No sections yet. Click &quot;Add section&quot; to begin.</div>
            )}
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <SectionCard
                  section={section}
                  onChangeTitle={(title) => updateTitle(section.id, title)}
                  onChangeContent={(content) => updateContent(section.id, content)}
                  onCopy={() => handleCopy(section.title, section.content)}
                  onCopyText={() => handleCopyText(section.title, section.content)}
                  onDelete={() => removeById(section.id)}
                  onTogglePublic={() => updatePublic(section.id, !section.isPublic)}
                  isPublic={section.isPublic}
                />
                <div className="flex justify-end">
                  <button
                    className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                    onClick={() => addToWorkspace(section)}
                    title="Add to Workspace"
                  >
                    Add to Workspace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="lg:col-span-1 sticky top-6 self-start space-y-6">
        <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">The Workspace</h2>
            <button className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => clearWorkspace()}>
              Clear
            </button>
          </div>
          <p className="text-slate-600 text-sm">Collect multiple blurbs, then copy everything at once.</p>
          <div className="flex gap-2">
            <button className="flex-1 px-2 py-1 rounded-md border hover:bg-gray-50" onClick={copyAllWorkspaceRich}>
              Copy All (Rich)
            </button>
            <button className="flex-1 px-2 py-1 rounded-md border hover:bg-gray-50" onClick={copyAllWorkspaceText}>
              Copy All (Text)
            </button>
          </div>
          <div className="divide-y">
            {workspace.map((w) => (
              <div key={w.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{w.title}</div>
                    <div className="text-xs text-slate-600" dangerouslySetInnerHTML={{ __html: w.html }} />
                  </div>
                  <button className="text-xs px-2 py-1 rounded-md border hover:bg-red-50 text-red-600" onClick={() => removeWorkspaceItem(w.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {workspace.length === 0 && (
              <div className="text-sm text-slate-600 py-6 text-center">No items yet. Use &quot;Add to Workspace&quot;.</div>
            )}
          </div>
        </div>
        {active === "handouts" && (
          <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Handouts</h2>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                if (file) {
                  await addHandoutFromFile(file, userId);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <span className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50 cursor-pointer">
                Upload handout
              </span>
            </label>
            <ul className="divide-y">
              {handouts.map((h) => (
                <li key={h.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate max-w-[14rem]" title={h.name}>{h.name}</div>
                    <div className="text-xs text-slate-600">{(h.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                      href={URL.createObjectURL(h.blob)}
          target="_blank"
          rel="noopener noreferrer"
        >
                      Open
        </a>
        <a
                      className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                      href={URL.createObjectURL(h.blob)}
                      download={h.name}
                    >
                      Download
                    </a>
                    <button
                      className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-red-50 text-red-600"
                      onClick={() => deleteHandout(h.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              {handouts.length === 0 && (
                <li className="text-sm text-slate-600 py-6 text-center">No handouts uploaded yet.</li>
              )}
            </ul>
          </div>
        )}

        <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scratchpad</h2>
          </div>
          <Scratchpad />
        </div>
      </aside>
    </div>
  );
}

function HandoutsManager({ handouts }: { handouts: ReturnType<typeof useHandouts> }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Handouts</h2>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await addHandoutFromFile(file);
              e.currentTarget.value = "";
            }
          }}
        />
        <span className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50 cursor-pointer">
          Upload handout
        </span>
      </label>
      <ul className="divide-y">
        {handouts.map((h) => (
          <li key={h.id} className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium truncate max-w-[28rem]" title={h.name}>{h.name}</div>
              <div className="text-xs text-slate-600">{(h.size / 1024).toFixed(1)} KB</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                href={URL.createObjectURL(h.blob)}
                download={h.name}
              >
                Download
              </a>
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-red-50 text-red-600"
                onClick={() => deleteHandout(h.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {handouts.length === 0 && (
          <li className="text-sm text-slate-600 py-6 text-center">No handouts uploaded yet.</li>
        )}
      </ul>
    </div>
  );
}

function Scratchpad() {
  const { data: session } = useSession();
  const userId = session?.user?.email?.toLowerCase();
  const html = useScratchpadHtml(userId);
  const [value, setValue] = useState(html);

  // Sync when IndexedDB loads
  React.useEffect(() => {
    setValue(html);
  }, [html]);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Placeholder.configure({ placeholder: "Type here…" })],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setValue(next);
      // Save debounced-like
      saveScratchpadHtml(userId, next);
    },
    editorProps: { attributes: { class: "prose prose-sm max-w-none p-3 min-h-[160px] focus:outline-none" } },
  });

  const copyScratchpadRich = async () => {
    if (!value) return;
    try {
      const blob = new Blob([value], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(htmlToPlainText(value));
    }
  };

  const copyScratchpadText = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(htmlToPlainText(value));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-600">Free-form notes. Auto-saves to this device.</div>
        <div className="flex gap-2">
          <button 
            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50" 
            onClick={copyScratchpadRich}
            disabled={!value}
          >
            Copy Rich
          </button>
          <button 
            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50" 
            onClick={copyScratchpadText}
            disabled={!value}
          >
            Copy Text
          </button>
        </div>
      </div>
      <div className="border rounded-md bg-white shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Shared Blurbs Manager Component
function SharedBlurbsManager() {
  const [search, setSearch] = useState("");
  const [sharedSections, setSharedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch shared sections from API
  React.useEffect(() => {
    async function fetchSharedSections() {
      try {
        const response = await fetch('/api/shared-sections');
        if (response.ok) {
          const data = await response.json();
          setSharedSections(data);
        }
      } catch (error) {
        console.error('Failed to fetch shared sections:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSharedSections();
  }, []);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sharedSections;
    const q = search.toLowerCase();
    return sharedSections.filter((s) => {
      const title = s.title?.toLowerCase() ?? "";
      const contentText = htmlToPlainText(s.content).toLowerCase();
      return title.includes(q) || contentText.includes(q);
    });
  }, [sharedSections, search]);

  const handleCopy = async (title: string, html: string) => {
    try {
      const htmlWithHeader = `<h3 style="margin:0 0 8px 0; font-weight:600;">${escapeHtml(title)}</h3>` + html;
      const blob = new Blob([htmlWithHeader], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
    }
  };

  const handleCopyText = async (title: string, html: string) => {
    await navigator.clipboard.writeText(`${title}\n\n${htmlToPlainText(html)}`);
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white shadow-sm p-8 text-center">
        <div className="text-slate-600">Loading shared blurbs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">Shared Blurbs</h2>
        <p className="text-sm text-slate-600 mb-4">
          Discover blurbs shared by other veterinarians. These are public blurbs that can help with common cases.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shared blurbs..."
          className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-0 focus:border-slate-900"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredSections.length === 0 && (
          <div className="col-span-full text-slate-600 text-center py-8">
            {search ? "No shared blurbs match your search." : "No shared blurbs available yet."}
          </div>
        )}
        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <SectionCard
              section={section}
              onChangeTitle={() => {}} // Read-only for shared sections
              onChangeContent={() => {}} // Read-only for shared sections
              onCopy={() => handleCopy(section.title, section.content)}
              onCopyText={() => handleCopyText(section.title, section.content)}
              onDelete={() => {}} // No delete for shared sections
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type Unit = "mg/kg" | "mcg/kg" | "mL/kg";

type CalcRow = {
  name: string;
  conc: number; // concentration value
  concUnit: string; // e.g. mg/mL or mcg/mL
  dosePerKg: number; // numeric dose per kg
  unit: Unit; // mg/kg, mcg/kg, mL/kg
};

function FastCalculations() {
  const [weightKg, setWeightKg] = useState<number | string>("");
  const weight = typeof weightKg === "number" ? weightKg : parseFloat(`${weightKg}`) || 0;

  // Placeholders; confirm clinically
  const [emergencyDrugs, setEmergencyDrugs] = useState<CalcRow[]>([
    { name: "Epinephrine (IV)", conc: 1, concUnit: "mg/mL", dosePerKg: 0.01, unit: "mg/kg" },
    { name: "Atropine (IV)", conc: 0.4, concUnit: "mg/mL", dosePerKg: 0.02, unit: "mg/kg" },
    { name: "Lidocaine 2% (dogs)", conc: 20, concUnit: "mg/mL", dosePerKg: 2, unit: "mg/kg" },
  ]);

  const [commonMeds, setCommonMeds] = useState<CalcRow[]>([
    { name: "Maropitant (Cerenia)", conc: 10, concUnit: "mg/mL", dosePerKg: 1, unit: "mg/kg" },
    { name: "Ondansetron", conc: 2, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
    { name: "Metoclopramide", conc: 5, concUnit: "mg/mL", dosePerKg: 0.5, unit: "mg/kg" },
  ]);

  const [sedation, setSedation] = useState<CalcRow[]>([
    { name: "Dexmedetomidine", conc: 0.5, concUnit: "mg/mL", dosePerKg: 5, unit: "mcg/kg" },
    { name: "Butorphanol", conc: 10, concUnit: "mg/mL", dosePerKg: 0.2, unit: "mg/kg" },
    { name: "Propofol", conc: 10, concUnit: "mg/mL", dosePerKg: 4, unit: "mg/kg" },
  ]);

  function calcDose(row: CalcRow): { doseAmount: number; doseUnit: string } {
    if (row.unit === "mg/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mg" };
    if (row.unit === "mcg/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mcg" };
    if (row.unit === "mL/kg") return { doseAmount: weight * row.dosePerKg, doseUnit: "mL" };
    return { doseAmount: 0, doseUnit: "mg" };
  }

  function calcVolumeMl(row: CalcRow): number | null {
    // Only compute volume when we have a concentration in mg/mL or mcg/mL and dose in mg or mcg
    const { doseAmount, doseUnit } = calcDose(row);
    if (row.conc <= 0) return null;
    if (doseUnit === "mg" && /mg\/mL/i.test(row.concUnit)) return doseAmount / row.conc;
    if (doseUnit === "mcg" && /mcg\/mL/i.test(row.concUnit)) return doseAmount / row.conc;
    return null;
  }

  const format = (n?: number | null, digits = 2) => (n == null || !isFinite(n) ? "-" : n.toFixed(digits));

  function TableEditor({ title, rows, setRows, defaultRow }: { title: string; rows: CalcRow[]; setRows: (r: CalcRow[]) => void; defaultRow: CalcRow }) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left p-2 border-b border-slate-200">Drug</th>
                <th className="text-left p-2 border-b border-slate-200">Concentration</th>
                <th className="text-left p-2 border-b border-slate-200">Dosage</th>
                <th className="text-right p-2 border-b border-slate-200">Dose</th>
                <th className="text-right p-2 border-b border-slate-200">Volume</th>
                <th className="text-right p-2 border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const { doseAmount, doseUnit } = calcDose(r);
                const vol = calcVolumeMl(r);
                return (
                  <tr key={idx} className="odd:bg-white even:bg-slate-50 align-top">
                    <td className="p-2 border-b border-slate-200">
                      <input
                        className="w-full rounded border px-2 py-1"
                        value={r.name}
                        onChange={(e) => {
                          const copy = [...rows];
                          copy[idx] = { ...r, name: e.target.value };
                          setRows(copy);
                        }}
                      />
                    </td>
                    <td className="p-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 rounded border px-2 py-1"
                          value={r.conc}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx] = { ...r, conc: parseFloat(e.target.value) || 0 };
                            setRows(copy);
                          }}
                        />
                        <select
                          className="rounded border px-2 py-1"
                          value={r.concUnit}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx] = { ...r, concUnit: e.target.value };
                            setRows(copy);
                          }}
                        >
                          <option>mg/mL</option>
                          <option>mcg/mL</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 rounded border px-2 py-1"
                          value={r.dosePerKg}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx] = { ...r, dosePerKg: parseFloat(e.target.value) || 0 };
                            setRows(copy);
                          }}
                        />
                        <select
                          className="rounded border px-2 py-1"
                          value={r.unit}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx] = { ...r, unit: e.target.value as Unit };
                            setRows(copy);
                          }}
                        >
                          <option>mg/kg</option>
                          <option>mcg/kg</option>
                          <option>mL/kg</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-2 border-b border-slate-200 text-right whitespace-nowrap">{format(doseAmount)} {doseUnit}</td>
                    <td className="p-2 border-b border-slate-200 text-right whitespace-nowrap">{format(vol)} mL</td>
                    <td className="p-2 border-b border-slate-200 text-right">
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs hover:bg-red-50 text-red-600"
                        onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
            onClick={() => setRows([...rows, { ...defaultRow }])}
          >
            <Plus size={16} /> Add item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Patient weight (kg)</label>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            type="number"
            step="0.01"
            className="mt-1 w-36 rounded-md border px-3 py-2"
            placeholder="e.g. 6.4"
          />
        </div>
        <div className="text-sm text-slate-600">Auto-calculated doses are estimates. Verify clinically.</div>
      </div>

      <div className="space-y-6">
        <TableEditor
          title="Common medications"
          rows={commonMeds}
          setRows={setCommonMeds}
          defaultRow={{ name: "New medication", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
        />
        <TableEditor
          title="Emergency drugs"
          rows={emergencyDrugs}
          setRows={setEmergencyDrugs}
          defaultRow={{ name: "New emergency drug", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
        />
      </div>

      <TableEditor
        title="Anesthetics / Sedatives"
        rows={sedation}
        setRows={setSedation}
        defaultRow={{ name: "New sedative", conc: 1, concUnit: "mg/mL", dosePerKg: 0, unit: "mg/kg" }}
      />
    </div>
  );
}
