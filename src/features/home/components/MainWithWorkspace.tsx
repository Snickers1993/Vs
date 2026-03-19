"use client";

import type { Handout } from "@/lib/db";
import {
  addHandoutFromFile,
  addWorkspaceItem,
  deleteHandout,
  useHandouts,
} from "@/lib/db";
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
    <div className="glass rounded-xl p-4 space-y-3">
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
              <div className="col-span-full glass rounded-xl border-dashed !border-white/30 p-8 text-center space-y-3">
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
                    className="glass-btn text-xs px-2 py-1 rounded-md"
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
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scratchpad</h2>
          </div>
          <Scratchpad />
        </div>
      </aside>
    </div>
  );
}
