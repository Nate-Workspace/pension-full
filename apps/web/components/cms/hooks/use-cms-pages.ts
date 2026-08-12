"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCmsPages } from "@/components/cms/services/cms-service";

export const CMS_PAGES_QUERY_KEY = ["cms", "pages"] as const;

export function useCmsPages() {
  return useQuery({
    queryKey: CMS_PAGES_QUERY_KEY,
    queryFn: fetchCmsPages,
  });
}
