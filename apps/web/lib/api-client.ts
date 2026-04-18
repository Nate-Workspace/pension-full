const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/login");
  }

  return response;
}
