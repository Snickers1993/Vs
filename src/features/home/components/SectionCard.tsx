"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Trash2, ChevronDown, ChevronUp, Star, Plus } from "lucide-react";
import type { Section } from "@/features/home/types";
import { htmlToPlainText } from "@/features/home/utils";
import RichEditor from "@/features/home/components/RichEditor";

type SectionCardProps = {
  section: Section;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onCopy: () => Promise<void> | void;
  onCopyText: () => Promise<void> | void;
  onDelete: () => void;
  onAddToWorkspace?: () => Promise<void> | void;
  onTogglePublic?: () => void;
  onToggleStarred?: () => void;
  isPublic?: boolean;
  isStarred?: boolean;
};

export default function SectionCard({
  section,
  onChangeTitle,
  onChangeContent,
  onCopy,
  onCopyText,
  onDelete,
  onAddToWorkspace,
  onTogglePublic,
  onToggleStarred,
  isPublic,
  isStarred,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"none" | "html" | "text">("none");
  const [addedToWorkspace, setAddedToWorkspace] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localTitle !== section.title) {
        onChangeTitle(localTitle);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localTitle, section.title, onChangeTitle]);

  const previewText = useMemo(() => htmlToPlainText(section.content).trim(), [section.content]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const setCopiedWithTimeout = useCallback((type: "html" | "text") => {
    setCopied(type);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied("none"), 1200);
  }, []);

  const setAddedWithTimeout = useCallback(() => {
    setAddedToWorkspace(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedToWorkspace(false), 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const handleCopyHtml = async () => {
    await onCopy();
    setCopiedWithTimeout("html");
  };

  const handleCopyText = async () => {
    await onCopyText();
    setCopiedWithTimeout("text");
  };

  const handleAddToWorkspace = async () => {
    if (!onAddToWorkspace) return;
    await onAddToWorkspace();
    setAddedWithTimeout();
  };

  return (
    <div className="glass-strong rounded-[1.5rem] p-4 space-y-3 shadow-[0_22px_40px_rgba(148,163,184,0.18)]">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-lg font-semibold px-2 h-9 rounded-xl hover:bg-white/20 focus:bg-white/20"
          value={localTitle}
          onChange={(event) => setLocalTitle(event.target.value)}
          placeholder="Title"
        />
        {onToggleStarred && (
          <button
            className="glass-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:text-yellow-500"
            onClick={onToggleStarred}
            title={isStarred ? "Remove from starred" : "Add to starred"}
            aria-label={isStarred ? "Remove from starred" : "Add to starred"}
          >
            <Star size={18} className={isStarred ? "text-yellow-500 fill-yellow-500" : ""} />
          </button>
        )}
      </div>

      {(copied !== "none" || addedToWorkspace) && (
        <div className="text-xs text-emerald-700">
          {addedToWorkspace ? "Added to workspace" : copied === "html" ? "Copied rich text" : "Copied plain text"}
        </div>
      )}

      {expanded ? (
        <div className="space-y-2">
          <RichEditor value={section.content} onChange={onChangeContent} placeholder="Write content..." />
          <div className="flex justify-end">
            <button className="glass-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm" onClick={() => setExpanded(false)}>
              <ChevronUp size={16} /> Collapse
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="glass-inset relative w-full text-left rounded-2xl p-3 text-sm text-slate-700 max-h-24 overflow-hidden hover:bg-white/20"
          onClick={() => setExpanded(true)}
          title="Click to expand"
        >
          {previewText ? previewText : "Click to add content..."}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/40 via-white/10 to-transparent" />
          <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-slate-700 text-xs bg-white/18 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/28 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
            Expand <ChevronDown size={14} />
          </div>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20">
        <div className="glass-inset flex flex-wrap items-center gap-1 rounded-full p-1">
          <button
            className="glass-btn inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm"
            onClick={() => setExpanded(true)}
            title="Edit content"
          >
            Edit
          </button>
          {onAddToWorkspace && (
            <button
              className="glass-strong inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-violet-950 shadow-[0_10px_22px_rgba(124,58,237,0.12)]"
              onClick={handleAddToWorkspace}
              title="Add to Workspace"
            >
              <Plus size={14} /> Add to Workspace
            </button>
          )}
          <button
            className="glass-btn inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm"
            onClick={handleCopyHtml}
            title="Copy rich text"
            aria-label="Copy as rich text"
          >
            <Copy size={14} /> Copy
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onTogglePublic && (
            <label className="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={isPublic || false} onChange={onTogglePublic} className="rounded border-gray-300" />
              Public
            </label>
          )}
          <button
            className="glass-btn inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-red-600 hover:!bg-red-500/14"
            onClick={onDelete}
            title="Delete section"
            aria-label="Delete section"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="text-xs text-slate-500 hover:text-slate-700"
          onClick={handleCopyText}
          title="Copy as plain text"
          aria-label="Copy as plain text"
        >
          Copy plain text
        </button>
      </div>
    </div>
  );
}
