"use client";

import { useState } from "react";
import type { Handout } from "@/lib/db";
import {
  addHandoutFromFile,
  addWorkspaceItem,
  deleteHandout,
  useHandouts,
} from "@/lib/db";
import { NotebookPen, PanelLeftOpen, SquarePen } from "lucide-react";
import HandoutsManager from "@/features/home/components/HandoutsManager";
import FastCalculations from "@/features/home/components/FastCalculations";
import Scratchpad from "@/features/home/components/Scratchpad";
import SectionCard from "@/features/home/components/SectionCard";
import SharedBlurbsManager from "@/features/home/components/SharedBlurbsManager";
import UtilityPanelShell from "@/features/home/components/UtilityPanelShell";
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

type UtilityPanel = "workspace" | "scratchpad" | null;

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
        <span className="glass-btn inline-flex h-9 items-center justify-center rounded-full px-3 text-sm cursor-pointer">
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
                className="glass-btn inline-flex h-9 items-center justify-center rounded-full px-3 text-sm"
                href={URL.createObjectURL(handout.blob)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
              <a
                className="glass-btn inline-flex h-9 items-center justify-center rounded-full px-3 text-sm"
                href={URL.createObjectURL(handout.blob)}
                download={handout.name}
              >
                Download
              </a>
              <button
                className="glass-btn inline-flex h-9 items-center justify-center rounded-full px-3 text-sm text-red-600 hover:!bg-red-500/14"
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

function UtilityRail({ sidePanel, setSidePanel }: { sidePanel: UtilityPanel; setSidePanel: (panel: UtilityPanel) => void }) {
  const tabs = [
    { key: "workspace" as const, label: "Workspace", icon: PanelLeftOpen },
    { key: "scratchpad" as const, label: "Scratchpad", icon: NotebookPen },
  ];

  return (
    <div className="glass rounded-[2rem] p-3 shadow-[0_28px_60px_rgba(124,58,237,0.14)]">
      <div className="mb-3 rounded-[1.25rem] px-3 py-2 glass-inset">
        <div className="text-[11px] uppercase tracking-[0.18em] text-violet-700/80">Utility river</div>
        <div className="text-sm font-medium text-slate-800">Workspace and scratchpad</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = sidePanel === tab.key;
          return (
            <button
              key={tab.key}
              className={`glass-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-3 text-sm font-medium text-slate-700 transition-all duration-200 ${active ? "glass-strong text-violet-950 shadow-[0_14px_30px_rgba(124,58,237,0.16)]" : ""}`}
              onClick={() => setSidePanel(active ? null : tab.key)}
              title={`Toggle ${tab.label.toLowerCase()}`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
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
  const [sidePanel, setSidePanel] = useState<UtilityPanel>("workspace");

  const addToWorkspace = async (section: Section) => {
    await addWorkspaceItem({ title: section.title, html: section.content, userId });
    setSidePanel("workspace");
  };

  const showUtilities = active !== "handouts";
  const showLeftPanel = showUtilities && sidePanel !== null;

  return (
    <div className="relative">
      <div className={`grid grid-cols-1 gap-6 items-start transition-[grid-template-columns] duration-300 xl:${showUtilities ? "grid-cols-[24rem_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]"}`}>
        {showUtilities && (
          <aside className="hidden xl:block sticky top-6 self-start">
            <div className="space-y-4">
              <UtilityRail sidePanel={sidePanel} setSidePanel={setSidePanel} />

              {showLeftPanel && (
                sidePanel === "workspace" ? (
                  <UtilityPanelShell eyebrow="Assembly area" title="Workspace" onClose={() => setSidePanel(null)}>
                    <WorkspaceSidebar userId={userId} />
                  </UtilityPanelShell>
                ) : (
                  <UtilityPanelShell eyebrow="Quick notes" title="Scratchpad" onClose={() => setSidePanel(null)}>
                    <div className="glass rounded-[1.5rem] p-4 space-y-3 shadow-[0_18px_34px_rgba(91,33,182,0.12)]">
                      <Scratchpad />
                    </div>
                  </UtilityPanelShell>
                )
              )}
            </div>
          </aside>
        )}

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
                    Click &quot;Add section&quot; above to create your first reusable blurb. Write once, then quickly search, stage, and copy discharge instructions.
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>1. Create blurbs for common cases (medications, exam findings, follow-up care)</p>
                    <p>2. Use the search bar to find them fast</p>
                    <p>3. Stage blurbs in Workspace, then copy the final note</p>
                  </div>
                </div>
              )}
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onChangeTitle={(title) => updateTitle(section.id, title)}
                  onChangeContent={(content) => updateContent(section.id, content)}
                  onCopy={() => handleCopy(section.title, section.content)}
                  onCopyText={() => handleCopyText(section.title, section.content)}
                  onDelete={() => removeById(section.id)}
                  onAddToWorkspace={() => addToWorkspace(section)}
                  onTogglePublic={() => updatePublic(section.id, !section.isPublic)}
                  onToggleStarred={() => updateStarred(section.id, !section.isStarred)}
                  isPublic={section.isPublic}
                  isStarred={section.isStarred}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {active === "handouts" && (
        <aside className="mt-6">
          <HandoutsSidebar handouts={handouts} userId={userId} />
        </aside>
      )}

      {showUtilities && (
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
