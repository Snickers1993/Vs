"use client";

import type { Handout } from "@/lib/db";
import {
  addHandoutFromFile,
  addWorkspaceItem,
  clearWorkspace,
  deleteHandout,
  removeWorkspaceItem,
  useHandouts,
  useWorkspaceItems,
} from "@/lib/db";
import HandoutsManager from "@/features/home/components/HandoutsManager";
import FastCalculations from "@/features/home/components/FastCalculations";
import Scratchpad from "@/features/home/components/Scratchpad";
import SectionCard from "@/features/home/components/SectionCard";
import SharedBlurbsManager from "@/features/home/components/SharedBlurbsManager";
import type { Section, TabKey } from "@/features/home/types";
import { escapeHtml } from "@/features/home/utils";
import { sanitizeRichTextHtml } from "@/lib/html";

type MainWithWorkspaceProps = {
  sections: Section[];
  updateTitle: (id: string, title: string) => void;
  updateContent: (id: string, html: string) => void;
  updatePublic: (id: string, isPublic: boolean) => void;
  updateStarred: (id: string, isStarred: boolean) => void;
  removeById: (id: string) => void;
  handleCopy: (title: string, html: string) => Promise<void>;
  handleCopyText: (title: string, html: string) => Promise<void>;
  active: TabKey;
  userId?: string;
};

function HandoutsSidebar({ handouts, userId }: { handouts: Handout[]; userId?: string }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Handouts</h2>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="file"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await addHandoutFromFile(file, userId);
              event.currentTarget.value = "";
            }
          }}
        />
        <span className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50 cursor-pointer">
          Upload handout
        </span>
      </label>
      <ul className="divide-y">
        {handouts.map((handout) => (
          <li key={handout.id} className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium truncate max-w-[14rem]" title={handout.name}>{handout.name}</div>
              <div className="text-xs text-slate-600">{(handout.size / 1024).toFixed(1)} KB</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                href={URL.createObjectURL(handout.blob)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
              <a
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-gray-50"
                href={URL.createObjectURL(handout.blob)}
                download={handout.name}
              >
                Download
              </a>
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm hover:bg-red-50 text-red-600"
                onClick={() => deleteHandout(handout.id)}
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

function WorkspaceSidebar({ userId }: { userId?: string }) {
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
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">The Workspace</h2>
        <button className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => clearWorkspace(userId)}>
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
        {workspace.map((item) => (
          <div key={item.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-slate-600 whitespace-pre-wrap">{item.text}</div>
              </div>
              <button className="text-xs px-2 py-1 rounded-md border hover:bg-red-50 text-red-600" onClick={() => removeWorkspaceItem(item.id)}>
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

export default function MainWithWorkspace({
  sections,
  updateTitle,
  updateContent,
  updatePublic,
  updateStarred,
  removeById,
  handleCopy,
  handleCopyText,
  active,
  userId,
}: MainWithWorkspaceProps) {
  const handouts = useHandouts(userId);

  const addToWorkspace = async (section: Section) => {
    await addWorkspaceItem({ title: section.title, html: section.content, userId });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
        {active === "handouts" ? (
          <HandoutsManager handouts={handouts} userId={userId} />
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
                  onToggleStarred={() => updateStarred(section.id, !section.isStarred)}
                  isPublic={section.isPublic}
                  isStarred={section.isStarred}
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
        <WorkspaceSidebar userId={userId} />
        {active === "handouts" && <HandoutsSidebar handouts={handouts} userId={userId} />}
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
