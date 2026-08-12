export function getServerApiBaseUrl(): string {
  return (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");
}

export async function fetchPublicJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getServerApiBaseUrl()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Public API request failed (${response.status}): ${path}`);
  }

  return (await response.json()) as T;
}
