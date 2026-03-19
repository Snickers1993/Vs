import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { addSection, deleteSection, type CollectionKey, updateSection, useSectionsByCollection } from "@/lib/db";
import { useSectionsApi } from "@/lib/sections";
import type { Section } from "@/features/home/types";

export function useCollection(collection: CollectionKey, userId?: string) {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const { sections: serverSections, addSectionApi, updateSectionApi, deleteSectionApi, error } = useSectionsApi(collection);
  const localSections = useSectionsByCollection(collection, userId);

  const sections = useMemo(() => {
    if (!isAuthenticated || error || !serverSections || serverSections.length === 0) {
      return localSections;
    }

    const serverMap = new Map(serverSections.map((section) => [section.id, section]));
    const mergedSections = [...serverSections];

    localSections.forEach((localSection) => {
      if (!serverMap.has(localSection.id)) {
        mergedSections.push({
          id: localSection.id,
          title: localSection.title,
          content: localSection.content,
          isPublic: localSection.isPublic,
          isStarred: localSection.isStarred,
          updatedAt: localSection.updatedAt,
          createdAt: localSection.createdAt,
        } as unknown as typeof serverSections[number]);
      }
    });

    return mergedSections.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [isAuthenticated, serverSections, localSections, error]);

  const syncLocalToServer = useCallback(async () => {
    if (!isAuthenticated || error || !serverSections) {
      return;
    }

    try {
      const serverIds = new Set(serverSections.map((section) => section.id));
      const localOnlySections = localSections.filter((section) => !serverIds.has(section.id));

      for (const section of localOnlySections) {
        try {
          await addSectionApi({
            id: section.id,
            collection: section.collection,
            title: section.title,
            content: section.content,
            isPublic: section.isPublic || false,
            isStarred: section.isStarred || false,
          });
        } catch (syncError) {
          console.warn(`Failed to sync section ${section.id} to server:`, syncError);
        }
      }
    } catch (syncError) {
      console.warn("Failed to sync local data to server:", syncError);
    }
  }, [isAuthenticated, error, serverSections, localSections, addSectionApi]);

  const hasSynced = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !error && serverSections && localSections.length > 0 && !hasSynced.current) {
      hasSynced.current = true;
      syncLocalToServer();
    }
  }, [isAuthenticated, error, serverSections, localSections, syncLocalToServer]);

  // Reset sync flag when collection changes
  useEffect(() => {
    hasSynced.current = false;
  }, [collection]);

  const add = useCallback(async () => {
    if (isAuthenticated && !error) {
      try {
        return await addSectionApi({ collection });
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return addSection(collection, userId);
  }, [collection, userId, isAuthenticated, error, addSectionApi]);

  const updateTitle = useCallback(async (id: string, title: string) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { title });
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return updateSection(id, { title });
  }, [isAuthenticated, error, updateSectionApi]);

  const updateContent = useCallback(async (id: string, content: string) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { content });
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return updateSection(id, { content });
  }, [isAuthenticated, error, updateSectionApi]);

  const updatePublic = useCallback(async (id: string, isPublic: boolean) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { isPublic });
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return updateSection(id, { isPublic });
  }, [isAuthenticated, error, updateSectionApi]);

  const updateStarred = useCallback(async (id: string, isStarred: boolean) => {
    if (isAuthenticated && !error) {
      try {
        return await updateSectionApi(id, { isStarred });
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return updateSection(id, { isStarred });
  }, [isAuthenticated, error, updateSectionApi]);

  const removeById = useCallback(async (id: string) => {
    if (isAuthenticated && !error) {
      try {
        return await deleteSectionApi(id);
      } catch {
        console.warn("Server API failed, falling back to local storage");
      }
    }

    return deleteSection(id);
  }, [isAuthenticated, error, deleteSectionApi]);

  return {
    sections: sections as Section[],
    add,
    updateTitle,
    updateContent,
    updatePublic,
    updateStarred,
    removeById,
    syncLocalToServer,
  };
}
