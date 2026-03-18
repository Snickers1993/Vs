"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Trash2, ChevronDown, ChevronUp, Star } from "lucide-react";
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
  onTogglePublic,
  onToggleStarred,
  isPublic,
  isStarred,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"none" | "html" | "text">("none");
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
      <div className="flex items-center gap-2">
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-lg font-semibold px-2 h-9 rounded hover:bg-gray-50 focus:bg-gray-50"
          value={localTitle}
          onChange={(event) => setLocalTitle(event.target.value)}
          placeholder="Title"
        />
        {onToggleStarred && (
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={onToggleStarred}
            title={isStarred ? "Remove from starred" : "Add to starred"}
          >
            <Star size={20} className={isStarred ? "text-yellow-500 fill-yellow-500" : "text-gray-400 hover:text-yellow-500"} />
          </button>
        )}
      </div>

      {copied !== "none" && (
        <div className="text-xs text-green-700">{copied === "html" ? "Copied rich text" : "Copied plain text"}</div>
      )}

      {expanded ? (
        <div className="space-y-2">
          <RichEditor value={section.content} onChange={onChangeContent} placeholder="Write contentâ€¦" />
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setExpanded(false)}>
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
            {previewText ? previewText : "Click to add contentâ€¦"}
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

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-4">
          {onTogglePublic && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPublic || false} onChange={onTogglePublic} className="rounded border-gray-300" />
              Public
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-white px-2 text-xs hover:bg-gray-50"
            onClick={handleCopyHtml}
            title="Copy to clipboard"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-white px-2 text-xs hover:bg-gray-50"
            onClick={handleCopyText}
            title="Copy as plain text"
          >
            Plain
          </button>
          <button
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-xs hover:bg-red-50 text-red-600"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
