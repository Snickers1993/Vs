"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const setCopiedWithTimeout = useCallback((type: "html" | "text") => {
    setCopied(type);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied("none"), 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
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

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-lg font-semibold px-2 h-9 rounded hover:bg-white/20 focus:bg-white/20"
          value={localTitle}
          onChange={(event) => setLocalTitle(event.target.value)}
          placeholder="Title"
        />
        {onToggleStarred && (
          <button
            className="p-1 rounded hover:bg-white/25 transition-colors"
            onClick={onToggleStarred}
            title={isStarred ? "Remove from starred" : "Add to starred"}
            aria-label={isStarred ? "Remove from starred" : "Add to starred"}
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
          <RichEditor value={section.content} onChange={onChangeContent} placeholder="Write content..." />
          <div className="flex justify-end">
            <button className="glass-btn inline-flex items-center gap-1 px-2 py-1 rounded-md" onClick={() => setExpanded(false)}>
              <ChevronUp size={16} /> Collapse
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className="relative w-full text-left rounded-md bg-white/20 border border-white/25 p-3 text-sm text-slate-700 max-h-24 overflow-hidden hover:bg-white/30"
            onClick={() => setExpanded(true)}
            title="Click to expand"
          >
            {previewText ? previewText : "Click to add content..."}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/40 to-transparent" />
            <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 text-slate-600 text-xs bg-white/30 px-2 py-0.5 rounded backdrop-blur-sm">
              Expand <ChevronDown size={14} />
            </div>
          </button>
          <div className="flex justify-end">
            <button
              className="glass-btn inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
              onClick={() => setExpanded(true)}
              title="Edit content"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/20">
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
            className="glass-btn inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs"
            onClick={handleCopyHtml}
            title="Copy to clipboard"
            aria-label="Copy as rich text"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            className="glass-btn inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs"
            onClick={handleCopyText}
            title="Copy as plain text"
            aria-label="Copy as plain text"
          >
            Plain
          </button>
          <button
            className="glass-btn inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs text-red-600 hover:!bg-red-500/20"
            onClick={onDelete}
            title="Delete section"
            aria-label="Delete section"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
