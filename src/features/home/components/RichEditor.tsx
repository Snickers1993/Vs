"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { sanitizeRichTextHtml } from "@/lib/html";

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 bg-white shadow-sm">
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italic
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        Underline
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Bullets
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        Numbers
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().setHardBreak().run()}>
        New line
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </button>
      <button className="px-2 py-1 text-sm rounded hover:bg-gray-100" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </button>
    </div>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Type hereâ€¦" }),
    ],
    content: sanitizeRichTextHtml(value || ""),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
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
