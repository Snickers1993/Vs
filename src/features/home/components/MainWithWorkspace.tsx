"use client";

import { useState } from "react";
import type { Handout } from "@/lib/db";
import {
  addHandoutFromFile,
  addWorkspaceItem,
  deleteHandout,
  useHandouts,
} from "@/lib/db";
import { NotebookPen, PanelRightClose, PanelRightOpen, SquarePen } from "lucide-react";
import HandoutsManager from "@/features/home/components/HandoutsManager";
import FastCalculations from "@/features/home/components/FastCalculations";
import Scratchpad from "@/features/home/components/Scratchpad";
import SectionCard from "@/features/home/components/SectionCard";
import SharedBlurbsManager from "@/features/home/components/SharedBlurbsManager";
import WorkspaceSidebar from "@/features/home/components/WorkspaceSidebar";
import type { Section, TabKey } from "@/features/home/types";

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
    <div className="glass rounded-[1.5rem] p-4 space-y-3 shadow-[0_18px_34px_rgba(15,23,42,0.1)]">
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
        <span className="glass-btn inline-flex h-9 items-center justify-center rounded-md px-3 text-sm cursor-pointer">
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
                className="glass-btn inline-flex h-9 items-center justify-center rounded-md px-3 text-sm"
                href={URL.createObjectURL(handout.blob)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
              <a
                className="glass-btn inline-flex h-9 items-center justify-center rounded-md px-3 text-sm"
                href={URL.createObjectURL(handout.blob)}
                download={handout.name}
              >
                Download
              </a>
              <button
                className="glass-btn inline-flex h-9 items-center justify-center rounded-md px-3 text-sm text-red-600 hover:!bg-red-500/20"
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
  const [sidePanel, setSidePanel] = useState<"workspace" | "scratchpad" | null>("workspace");

  const addToWorkspace = async (section: Section) => {
    await addWorkspaceItem({ title: section.title, html: section.content, userId });
  };

  const togglePanel = (panel: "workspace" | "scratchpad") => {
    setSidePanel((current) => (current === panel ? null : panel));
  };

  const showDrawer = active !== "handouts";

  return (
    <div className="relative">
      <div className={`grid grid-cols-1 gap-6 items-start transition-[grid-template-columns,padding-right] duration-300 xl:${showDrawer && sidePanel ? "grid-cols-[minmax(0,1fr)_23rem] pr-16" : "grid-cols-[minmax(0,1fr)] pr-16"}`}>
        <div>
          {active === "handouts" ? (
            <HandoutsManager handouts={handouts} userId={userId} />
          ) : active === "fastCalculations" ? (
            <FastCalculations />
          ) : active === "sharedBlurbs" ? (
            <SharedBlurbsManager />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {sections.length === 0 && (
                <div className="col-span-full glass rounded-[1.75rem] border-dashed !border-white/35 p-8 text-center space-y-3 shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                  <h3 className="text-lg font-semibold text-slate-800">No sections yet</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Click &quot;Add section&quot; above to create your first reusable blurb. Write once, then quickly search, assemble, and copy discharge instructions.
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>1. Create blurbs for common cases (medications, exam findings, follow-up care)</p>
                    <p>2. Use the search bar to find them fast</p>
                    <p>3. Add blurbs to the Workspace, then copy everything at once</p>
                  </div>
                </div>
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
                      className="glass-btn text-xs px-3 py-1.5 rounded-full"
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

        {showDrawer && sidePanel && (
          <aside className="hidden xl:block sticky top-6 self-start">
            {sidePanel === "workspace" ? (
              <WorkspaceSidebar userId={userId} />
            ) : (
              <div className="glass rounded-[1.5rem] p-4 space-y-3 shadow-[0_18px_34px_rgba(91,33,182,0.12)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Scratchpad</h2>
                </div>
                <Scratchpad />
              </div>
            )}
          </aside>
        )}
      </div>

      {showDrawer && (
        <div className="hidden xl:flex fixed right-4 top-1/2 z-20 -translate-y-1/2 flex-col gap-3">
          <button
            className={`glass-btn flex h-28 w-12 items-center justify-center rounded-[1.5rem] px-2 text-xs font-medium text-slate-700 ${sidePanel === "workspace" ? "glass-strong text-violet-950" : ""}`}
            onClick={() => togglePanel("workspace")}
            title="Toggle workspace"
          >
            <span className="flex rotate-180 flex-col items-center gap-2 [writing-mode:vertical-rl]">
              <PanelRightOpen size={16} /> Workspace
            </span>
          </button>
          <button
            className={`glass-btn flex h-28 w-12 items-center justify-center rounded-[1.5rem] px-2 text-xs font-medium text-slate-700 ${sidePanel === "scratchpad" ? "glass-strong text-violet-950" : ""}`}
            onClick={() => togglePanel("scratchpad")}
            title="Toggle scratchpad"
          >
            <span className="flex rotate-180 flex-col items-center gap-2 [writing-mode:vertical-rl]">
              <NotebookPen size={16} /> Scratchpad
            </span>
          </button>
        </div>
      )}

      {showDrawer && sidePanel && (
        <button
          className="hidden xl:flex fixed right-[22.25rem] top-8 z-20 glass-btn h-10 w-10 items-center justify-center rounded-full text-slate-700"
          onClick={() => setSidePanel(null)}
          title="Hide side panel"
        >
          <PanelRightClose size={16} />
        </button>
      )}

      {active === "handouts" && (
        <aside className="mt-6">
          <HandoutsSidebar handouts={handouts} userId={userId} />
        </aside>
      )}

      {showDrawer && (
        <div className="mt-6 grid gap-4 xl:hidden">
          <details className="glass rounded-[1.5rem] p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-800">
              <span>Workspace</span>
              <SquarePen size={16} className="text-violet-700" />
            </summary>
            <div className="mt-4">
              <WorkspaceSidebar userId={userId} />
            </div>
          </details>
          <details className="glass rounded-[1.5rem] p-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-800">
              <span>Scratchpad</span>
              <NotebookPen size={16} className="text-violet-700" />
            </summary>
            <div className="mt-4 glass rounded-[1.5rem] p-4 space-y-3 shadow-[0_18px_34px_rgba(91,33,182,0.12)]">
              <Scratchpad />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
