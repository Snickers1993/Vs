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
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">The Workspace</h2>
        <button className="glass-btn text-xs px-2 py-1 rounded-md" onClick={() => clearWorkspace(userId)}>
          Clear
        </button>
      </div>
      <p className="text-slate-600 text-sm">Collect multiple blurbs, then copy everything at once.</p>
      <div className="flex gap-2">
        <button className="glass-btn flex-1 px-2 py-1 rounded-md" onClick={copyAllWorkspaceRich}>
          Copy All (Rich)
        </button>
        <button className="glass-btn flex-1 px-2 py-1 rounded-md" onClick={copyAllWorkspaceText}>
          Copy All (Text)
        </button>
      </div>
      <div className="divide-y divide-white/20">
        {workspace.map((item) => (
          <div key={item.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-slate-600 whitespace-pre-wrap">{item.text}</div>
              </div>
              <button className="glass-btn text-xs px-2 py-1 rounded-md text-red-600 hover:!bg-red-500/20" onClick={() => removeWorkspaceItem(item.id)}>
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
  );
}
