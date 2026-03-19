"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { matchesUserScope } from "@/lib/user-scope";
import SectionCard from "@/features/home/components/SectionCard";
import type { Section } from "@/features/home/types";
import { copyPlainSectionToClipboard, copyRichSectionToClipboard, htmlToPlainText } from "@/features/home/utils";

export default function SharedBlurbsManager() {
  const { data: session } = useSession();
  const userId = session?.user?.email?.toLowerCase();
  const [search, setSearch] = useState("");
  const [sharedSections, setSharedSections] = useState<Section[]>([]);
  const [localPublicSections, setLocalPublicSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllLocalPublicSections() {
      try {
        const allSections = await db.sections.toArray();
        const publicSections = allSections.filter((section) => section.isPublic && matchesUserScope(section.userId, userId));
        setLocalPublicSections(publicSections);
      } catch (error) {
        console.error("Failed to fetch local public sections:", error);
      }
    }

    fetchAllLocalPublicSections();
  }, [userId]);

  useEffect(() => {
    async function fetchSharedSections() {
      try {
        const response = await fetch("/api/shared-sections");
        if (response.ok) {
          const data = await response.json();
          setSharedSections(Array.isArray(data) ? data : data.items ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch shared sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedSections();
  }, []);

  const filteredSections = useMemo(() => {
    const allPublicSections = [...sharedSections, ...localPublicSections];
    if (!search.trim()) {
      return allPublicSections;
    }

    const query = search.toLowerCase();
    return allPublicSections.filter((section) => {
      const title = section.title?.toLowerCase() ?? "";
      const contentText = htmlToPlainText(section.content).toLowerCase();
      return title.includes(query) || contentText.includes(query);
    });
  }, [sharedSections, localPublicSections, search]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white shadow-sm p-8 text-center">
        <div className="text-slate-600">Loading shared blurbs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">Shared Blurbs</h2>
        <p className="text-sm text-slate-600 mb-4">
          Discover blurbs shared by other veterinarians. These are public blurbs that can help with common cases.
        </p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search shared blurbs..."
          className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-0 focus:border-slate-900"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredSections.length === 0 && (
          <div className="col-span-full text-slate-600 text-center py-8">
            {search ? "No shared blurbs match your search." : "No shared blurbs available yet."}
          </div>
        )}
        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <SectionCard
              section={section}
              onChangeTitle={() => {}}
              onChangeContent={() => {}}
              onCopy={() => copyRichSectionToClipboard(section.title, section.content)}
              onCopyText={() => copyPlainSectionToClipboard(section.title, section.content)}
              onDelete={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
