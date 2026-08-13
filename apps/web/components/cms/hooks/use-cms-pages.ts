"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCmsPages } from "@/components/cms/services/cms-service";
import { CMS_PAGES_QUERY_KEY } from "@/components/cms/hooks/cms-query-keys";

export { CMS_PAGES_QUERY_KEY };

export function useCmsPages() {
  return useQuery({
    queryKey: CMS_PAGES_QUERY_KEY,
    queryFn: fetchCmsPages,
  });
}
