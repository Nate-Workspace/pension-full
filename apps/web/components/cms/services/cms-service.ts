import { apiFetch } from "@/lib/api-client";
import { getCmsNavItem, type CmsNavSlug } from "@/lib/cms-navigation";
import type {
  CmsGlobalConfigResponse,
  CmsGlobalUpdateInput,
  CmsPageContentResponse,
  CmsPageContentUpdateInput,
  CmsPageSummary,
  CmsPagesResponse,
} from "@repo/contracts";

export type { CmsPageSummary };

export async function fetchCmsPages(): Promise<CmsPagesResponse> {
  const response = await apiFetch("/cms/pages", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load CMS pages (${response.status}).`);
  }

  return (await response.json()) as CmsPagesResponse;
}

export async function fetchCmsGlobalConfig(): Promise<CmsGlobalConfigResponse> {
  const response = await apiFetch("/cms/global", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load global CMS config (${response.status}).`);
  }

  return (await response.json()) as CmsGlobalConfigResponse;
}

export async function updateCmsGlobalConfig(
  input: CmsGlobalUpdateInput,
): Promise<CmsGlobalConfigResponse> {
  const response = await apiFetch("/cms/global", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to save global CMS config (${response.status}).`);
  }

  return (await response.json()) as CmsGlobalConfigResponse;
}

export async function fetchCmsPageContent(
  slug: Exclude<CmsNavSlug, "global">,
): Promise<CmsPageContentResponse> {
  const response = await apiFetch(`/cms/pages/${slug}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load CMS page content (${response.status}).`);
  }

  return (await response.json()) as CmsPageContentResponse;
}

export async function updateCmsPageContent(
  slug: Exclude<CmsNavSlug, "global">,
  input: CmsPageContentUpdateInput,
): Promise<CmsPageContentResponse> {
  const response = await apiFetch(`/cms/pages/${slug}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to save CMS page content (${response.status}).`);
  }

  return (await response.json()) as CmsPageContentResponse;
}

export function getCmsPreviewHref(slug: CmsNavSlug): string {
  return getCmsNavItem(slug)?.previewHref ?? "/";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(" ");
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Fall through.
  }

  return `Request failed (${response.status}).`;
}

export async function updateCmsGlobalConfigWithErrors(
  input: CmsGlobalUpdateInput,
): Promise<CmsGlobalConfigResponse> {
  const response = await apiFetch("/cms/global", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CmsGlobalConfigResponse;
}

export async function updateCmsPageContentWithErrors(
  slug: Exclude<CmsNavSlug, "global">,
  input: CmsPageContentUpdateInput,
): Promise<CmsPageContentResponse> {
  const response = await apiFetch(`/cms/pages/${slug}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CmsPageContentResponse;
}

type EntityRecord = { id: string; sortOrder: number };

async function fetchEntityList<T extends EntityRecord>(path: string): Promise<T[]> {
  const response = await apiFetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T[];
}

async function mutateEntity<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (method === "DELETE") {
    return (await response.json()) as T;
  }

  return (await response.json()) as T;
}

export const cmsEntityApi = {
  gallery: {
    list: () => fetchEntityList("/cms/gallery"),
    create: (input: unknown) => mutateEntity("/cms/gallery", "POST", input),
    update: (id: string, input: unknown) =>
      mutateEntity(`/cms/gallery/${id}`, "PATCH", input),
    delete: (id: string) => mutateEntity(`/cms/gallery/${id}`, "DELETE"),
  },
  amenities: {
    list: () => fetchEntityList("/cms/amenities"),
    create: (input: unknown) => mutateEntity("/cms/amenities", "POST", input),
    update: (id: string, input: unknown) =>
      mutateEntity(`/cms/amenities/${id}`, "PATCH", input),
    delete: (id: string) => mutateEntity(`/cms/amenities/${id}`, "DELETE"),
  },
  faqs: {
    list: () => fetchEntityList("/cms/faqs"),
    create: (input: unknown) => mutateEntity("/cms/faqs", "POST", input),
    update: (id: string, input: unknown) =>
      mutateEntity(`/cms/faqs/${id}`, "PATCH", input),
    delete: (id: string) => mutateEntity(`/cms/faqs/${id}`, "DELETE"),
  },
  attractions: {
    list: () => fetchEntityList("/cms/attractions"),
    create: (input: unknown) => mutateEntity("/cms/attractions", "POST", input),
    update: (id: string, input: unknown) =>
      mutateEntity(`/cms/attractions/${id}`, "PATCH", input),
    delete: (id: string) => mutateEntity(`/cms/attractions/${id}`, "DELETE"),
  },
} as const;
