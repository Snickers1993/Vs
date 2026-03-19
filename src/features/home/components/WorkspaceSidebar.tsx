"use client";

import { clearWorkspace, removeWorkspaceItem, useWorkspaceItems } from "@/lib/db";
import { escapeHtml } from "@/features/home/utils";
import { sanitizeRichTextHtml } from "@/lib/html";

export default function WorkspaceSidebar({ userId }: { userId?: string }) {
  const workspace = useWorkspaceItems(userId);

  const copyAllWorkspaceRich = async () => {
    const html = workspace
      .map((item) => `<h3 style="margin:0 0 8px 0; font-weight:600;">${escapeHtml(item.title)}</h3>${sanitizeRichTextHtml(item.html)}`)
      .join("<hr style=\"margin:16px 0; border:none; border-top:1px solid #e5e7eb;\"/>");

    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]);
    } catch {
      await navigator.clipboard.writeText(workspace.map((item) => `${item.title}\n\n${item.text}`).join("\n\n---\n\n"));
    }
  };

  const copyAllWorkspaceText = async () => {
    await navigator.clipboard.writeText(workspace.map((item) => `${item.title}\n\n${item.text}`).join("\n\n---\n\n"));
  };

  return (
    <div className="glass-strong rounded-[1.75rem] p-4 space-y-4 shadow-[0_24px_44px_rgba(59,130,246,0.12)]">
      <div className="glass-inset rounded-[1.25rem] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Final assembly</h2>
            <p className="text-xs text-slate-600 mt-1">{workspace.length} section{workspace.length === 1 ? "" : "s"} staged for the final note</p>
          </div>
          <button className="glass-btn text-xs px-3 py-1.5 rounded-full" onClick={() => clearWorkspace(userId)}>
            Clear
          </button>
        </div>
      </div>

      <div className="glass-inset rounded-2xl px-3 py-3 text-sm text-slate-600">
        Use this panel as the final discharge assembly area. Add the strongest blurbs from the library, then copy the finished output when ready.
      </div>

      <div className="glass-inset flex gap-2 rounded-[1.25rem] p-1.5">
        <button className="glass-btn flex-1 px-3 py-2 rounded-full" onClick={copyAllWorkspaceRich}>
          Copy final note
        </button>
        <button className="glass-btn flex-1 px-3 py-2 rounded-full" onClick={copyAllWorkspaceText}>
          Copy plain text
        </button>
      </div>

      <div className="space-y-3">
        {workspace.map((item) => (
          <div key={item.id} className="glass-inset rounded-2xl px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-xs text-slate-600 whitespace-pre-wrap">{item.text}</div>
              </div>
              <button className="glass-btn text-xs px-3 py-1.5 rounded-full text-red-600 hover:!bg-red-500/14" onClick={() => removeWorkspaceItem(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
        {workspace.length === 0 && (
          <div className="glass-inset rounded-2xl text-sm text-slate-600 py-6 px-4 text-center">No sections staged yet. Use “Add to Workspace” on any card.</div>
        )}
      </div>
    </div>
  );
}
