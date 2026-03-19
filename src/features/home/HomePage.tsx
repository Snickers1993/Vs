"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, Download, Plus, Star, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { type CollectionKey, useStarredSections } from "@/lib/db";
import MainWithWorkspace from "@/features/home/components/MainWithWorkspace";
import { DEFAULT_TABS, type TabKey } from "@/features/home/types";
import { copyPlainSectionToClipboard, copyRichSectionToClipboard, exportAllData, filterSectionsBySearch, importData } from "@/features/home/utils";
import { useCollection } from "@/features/home/useCollection";

export default function HomePage() {
  const [active, setActive] = useState<TabKey>("medications");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);
  const userId = session?.user?.email?.toLowerCase();

  const collectionForActive: CollectionKey = useMemo(() => {
    if (active === "fastCalculations") return "medications";
    if (active === "monitoring") return "monitoring";
    if (active === "starred") return "medications";
    return active as CollectionKey;
  }, [active]);

  const { sections, add, updateTitle, updateContent, updatePublic, updateStarred, removeById, syncLocalToServer } = useCollection(collectionForActive, userId);
  const starredSections = useStarredSections(userId);

  const handleImport = useCallback(() => {
    importData(userId, () => { /* Dexie live queries auto-update */ });
  }, [userId]);

  const visibleSections = useMemo(() => {
    const baseSections = active === "starred" ? starredSections : sections;
    return filterSectionsBySearch(baseSections, debouncedSearch);
  }, [active, sections, starredSections, debouncedSearch]);

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="glass rounded-[2rem] px-4 py-4 md:px-5 md:py-5 shadow-[0_28px_60px_rgba(148,163,184,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TABS.map((tab) => {
              const isActive = active === tab.key;
              const isFast = tab.key === "fastCalculations";
              const isShared = tab.key === "sharedBlurbs";
              const isStarred = tab.key === "starred";
              const base = "px-3 py-1.5 text-sm rounded-full";
              const className = isFast
                ? isActive
                  ? `${base} glass-strong text-amber-950 border-white/55 shadow-[0_12px_26px_rgba(245,158,11,0.14)]`
                  : `${base} glass-btn text-amber-900`
                : isShared
                  ? isActive
                    ? `${base} glass-strong text-blue-950 border-white/55 shadow-[0_12px_26px_rgba(59,130,246,0.14)]`
                    : `${base} glass-btn text-blue-900`
                  : isStarred
                    ? isActive
                      ? `${base} glass-strong text-yellow-950 border-white/55 shadow-[0_12px_26px_rgba(234,179,8,0.14)]`
                      : `${base} glass-btn text-yellow-900`
                    : isActive
                      ? `${base} glass-strong text-slate-900 border-white/55 shadow-[0_12px_26px_rgba(15,23,42,0.12)]`
                      : `${base} glass-btn text-slate-800`;

              return (
                <button key={tab.key} className={className} onClick={() => setActive(tab.key)}>
                  {isFast && <Calculator size={16} className="mr-1 inline" />}
                  {isStarred && <Star size={16} className="mr-1 inline" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="glass-strong inline-flex items-center gap-2 px-3 py-2 rounded-full text-slate-900 border-white/55 shadow-[0_14px_28px_rgba(59,130,246,0.12)]"
              onClick={() => add()}
            >
              <Plus size={18} /> Add section
            </button>
          </div>
        </div>

        {active !== "fastCalculations" && active !== "monitoring" && active !== "starred" && (
          <div className="mb-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or content..."
              className="w-full md:w-1/2 rounded-md glass-input px-3 py-2 text-slate-900 placeholder:text-slate-500"
            />
          </div>
        )}

        <MainWithWorkspace
          sections={visibleSections}
          updateTitle={updateTitle}
          updateContent={updateContent}
          updatePublic={updatePublic}
          updateStarred={updateStarred}
          removeById={removeById}
          handleCopy={copyRichSectionToClipboard}
          handleCopyText={copyPlainSectionToClipboard}
          active={active}
          userId={userId}
        />

        <footer className="mt-8 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              VetBlurbs - Veterinary Practice Management
            </div>
            <div className="flex gap-2">
              <button
                className="glass-btn inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-blue-700"
                onClick={syncLocalToServer}
                title="Sync local data to server"
              >
                <Upload size={14} /> Sync
              </button>
              <button
                className="glass-btn inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-slate-700"
                onClick={() => exportAllData(userId)}
                title="Download all data"
              >
                <Download size={14} /> Export
              </button>
              <button
                className="glass-btn inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-slate-700"
                onClick={handleImport}
                title="Upload data backup"
              >
                <Upload size={14} /> Import
              </button>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </div>
  );
}
