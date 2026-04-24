const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: ApiFetchOptions): Promise<Response> {
  const { skipAuthRedirect = false, ...requestInit } = init ?? {};

  const response = await fetch(buildApiUrl(path), {
    ...requestInit,
    credentials: "include",
  });

  if (!skipAuthRedirect && response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/auth/login");
  }

  return response;
}
