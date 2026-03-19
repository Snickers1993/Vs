"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useSession } from "next-auth/react";
import { useScratchpadHtml, saveScratchpadHtml } from "@/lib/db";
import { sanitizeRichTextHtml } from "@/lib/html";
import { htmlToPlainText } from "@/features/home/utils";

export default function Scratchpad() {
  const { data: session } = useSession();
  const userId = session?.user?.email?.toLowerCase();
  const html = useScratchpadHtml(userId);
  const [value, setValue] = useState(html);

  useEffect(() => {
    setValue(html);
  }, [html]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Type hereâ€¦" }),
    ],
    content: sanitizeRichTextHtml(value || ""),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      const next = nextEditor.getHTML();
      setValue(next);
      saveScratchpadHtml(userId, next);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-3 min-h-[160px] focus:outline-none",
      },
    },
  });

  const copyScratchpadRich = async () => {
    if (!value) {
      return;
    }

    try {
      const blob = new Blob([sanitizeRichTextHtml(value)], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(htmlToPlainText(value));
    }
  };

  const copyScratchpadText = async () => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(htmlToPlainText(value));
  };

  return (
    <div className="space-y-3">
      <div className="glass-inset rounded-2xl px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600">Free-form notes. Auto-saves to this device.</div>
          <div className="flex gap-2">
            <button className="glass-btn text-xs px-3 py-1.5 rounded-full" onClick={copyScratchpadRich} disabled={!value}>
              Copy Rich
            </button>
            <button className="glass-btn text-xs px-3 py-1.5 rounded-full" onClick={copyScratchpadText} disabled={!value}>
              Copy Text
            </button>
          </div>
        </div>
      </div>
      <div className="glass-inset rounded-[1.25rem] p-1.5">
        <div className="glass rounded-[1rem]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
