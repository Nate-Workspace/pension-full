"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CMS_PAGES_QUERY_KEY,
  getCmsPageContentQueryKey,
} from "@/components/cms/hooks/cms-query-keys";
import {
  fetchCmsPageContent,
  updateCmsPageContentWithErrors,
} from "@/components/cms/services/cms-service";
import type { CmsPageContentUpdateInput, CmsPageSlug } from "@repo/contracts";

export function useCmsPageContent(slug: CmsPageSlug) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: getCmsPageContentQueryKey(slug),
    queryFn: () => fetchCmsPageContent(slug),
  });

  const mutation = useMutation({
    mutationFn: (input: CmsPageContentUpdateInput) =>
      updateCmsPageContentWithErrors(slug, input),
    onSuccess: (data) => {
      queryClient.setQueryData(getCmsPageContentQueryKey(slug), data);
      void queryClient.invalidateQueries({ queryKey: CMS_PAGES_QUERY_KEY });
    },
  });

  return {
    page: query.data,
    isLoading: query.isPending,
    isSaving: mutation.isPending,
    error: query.error ?? mutation.error,
    saveMessage: mutation.isSuccess ? "Page content saved." : null,
    save: mutation.mutateAsync,
  };
}
