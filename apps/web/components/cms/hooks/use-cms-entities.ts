"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CMS_PAGES_QUERY_KEY } from "@/components/cms/hooks/cms-query-keys";
import { cmsEntityApi } from "@/components/cms/services/cms-service";
import type { CmsEntityKind } from "@/lib/cms-entities";

export function getCmsEntityQueryKey(kind: CmsEntityKind) {
  return ["cms", "entities", kind] as const;
}

export function useCmsEntities(kind: CmsEntityKind) {
  const queryClient = useQueryClient();
  const queryKey = getCmsEntityQueryKey(kind);
  const api = cmsEntityApi[kind];

  const query = useQuery({
    queryKey,
    queryFn: () => api.list(),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.invalidateQueries({ queryKey: CMS_PAGES_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["cms", "pages", kind === "faqs" ? "faq" : kind] });
  };

  const createMutation = useMutation({
    mutationFn: (input: unknown) => api.create(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) => api.update(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isPending,
    isSaving:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: query.error ?? createMutation.error ?? updateMutation.error ?? deleteMutation.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
