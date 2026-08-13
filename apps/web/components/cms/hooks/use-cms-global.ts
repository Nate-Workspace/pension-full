"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CMS_GLOBAL_QUERY_KEY,
  CMS_PAGES_QUERY_KEY,
} from "@/components/cms/hooks/cms-query-keys";
import {
  fetchCmsGlobalConfig,
  updateCmsGlobalConfigWithErrors,
} from "@/components/cms/services/cms-service";
import type { CmsGlobalUpdateInput } from "@repo/contracts";

export function useCmsGlobal() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CMS_GLOBAL_QUERY_KEY,
    queryFn: fetchCmsGlobalConfig,
  });

  const mutation = useMutation({
    mutationFn: (input: CmsGlobalUpdateInput) =>
      updateCmsGlobalConfigWithErrors(input),
    onSuccess: (data) => {
      queryClient.setQueryData(CMS_GLOBAL_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: CMS_PAGES_QUERY_KEY });
    },
  });

  return {
    config: query.data,
    isLoading: query.isPending,
    isSaving: mutation.isPending,
    error: query.error ?? mutation.error,
    saveMessage: mutation.isSuccess ? "Global settings saved." : null,
    save: mutation.mutateAsync,
  };
}
