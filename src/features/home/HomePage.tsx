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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TABS.map((tab) => {
              const isActive = active === tab.key;
              const isFast = tab.key === "fastCalculations";
              const isShared = tab.key === "sharedBlurbs";
              const isStarred = tab.key === "starred";
              const base = "px-2 py-1 text-sm rounded-full border";
              const className = isFast
                ? isActive
                  ? `${base} bg-amber-600 border-amber-700 text-white`
                  : `${base} bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100`
                : isShared
                  ? isActive
                    ? `${base} bg-blue-600 border-blue-700 text-white`
                    : `${base} bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100`
                  : isStarred
                    ? isActive
                      ? `${base} bg-yellow-600 border-yellow-700 text-white`
                      : `${base} bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100`
                    : isActive
                      ? `${base} bg-slate-900 text-white`
                      : `${base} bg-white hover:bg-gray-50`;

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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
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
              className="w-full md:w-1/2 rounded-md border bg-white px-3 py-2 outline-none ring-0 focus:border-slate-900"
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

        <footer className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              VetBlurbs - Veterinary Practice Management
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border bg-blue-50 text-blue-700 hover:bg-blue-100"
                onClick={syncLocalToServer}
                title="Sync local data to server"
              >
                <Upload size={14} /> Sync
              </button>
              <button
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50"
                onClick={() => exportAllData(userId)}
                title="Download all data"
              >
                <Download size={14} /> Export
              </button>
              <button
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50"
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
  );
}
