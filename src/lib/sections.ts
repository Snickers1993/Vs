import useSWR from "swr";

export type SectionDto = {
  id: string;
  userId: string;
  collection: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSectionsApi(collection?: string) {
  const key = collection ? `/api/sections?collection=${encodeURIComponent(collection)}` : "/api/sections";
  const { data, error, mutate, isLoading } = useSWR<SectionDto[]>(key, fetcher);

  async function addSectionApi(partial: { collection: string; title?: string; content?: string }) {
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const json = await res.json();
    mutate();
    return json as SectionDto;
  }

  async function updateSectionApi(id: string, partial: { title?: string; content?: string }) {
    await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    mutate();
  }

  async function deleteSectionApi(id: string) {
    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    mutate();
  }

  return { sections: data ?? [], isLoading, error, addSectionApi, updateSectionApi, deleteSectionApi };
}


