export function buildMapEmbedUrl(
  mapEmbedUrl: string,
  address: string,
  city: string,
): string | null {
  const configured = mapEmbedUrl.trim();
  if (configured) {
    return configured;
  }

  const query = [address, city].filter(Boolean).join(", ").trim();
  if (!query) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
