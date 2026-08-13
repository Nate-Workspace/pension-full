export const CMS_PAGES_QUERY_KEY = ["cms", "pages"] as const;
export const CMS_GLOBAL_QUERY_KEY = ["cms", "global"] as const;

export function getCmsPageContentQueryKey(slug: string) {
  return ["cms", "pages", slug] as const;
}
