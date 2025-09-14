import useSWR from "swr";

export type SectionDto = {
  id: string;
  userId: string;
  collection: string;
  title: string;
  content: string;
  isPublic?: boolean;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    // If server returns error (like 503), return empty array instead of throwing
    if (response.status === 503) {
      console.warn("Database not available, using empty sections");
      return [];
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export function useSectionsApi(collection?: string) {
  const key = collection ? `/api/sections?collection=${encodeURIComponent(collection)}` : "/api/sections";
  const { data, error, mutate, isLoading } = useSWR<SectionDto[]>(key, fetcher);

  async function addSectionApi(partial: { collection: string; title?: string; content?: string; isPublic?: boolean; isStarred?: boolean }) {
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      if (res.status === 503) {
        throw new Error("Database not available");
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    mutate();
    return json as SectionDto;
  }

  async function updateSectionApi(id: string, partial: { title?: string; content?: string; isPublic?: boolean; isStarred?: boolean }) {
    const res = await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      if (res.status === 503) {
        throw new Error("Database not available");
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    mutate();
  }

  async function deleteSectionApi(id: string) {
    const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      if (res.status === 503) {
        throw new Error("Database not available");
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    mutate();
  }

  return { sections: data ?? [], isLoading, error, addSectionApi, updateSectionApi, deleteSectionApi };
}


