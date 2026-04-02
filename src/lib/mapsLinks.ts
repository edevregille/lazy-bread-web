export type MapsLinkParams = {
  address: string;
};

/** Address-only query sent to map providers (no venue name). */
export function buildMapsSearchQuery({ address }: MapsLinkParams): string {
  return address.trim();
}

export function isIOSUserAgent(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}

export function buildGoogleMapsSearchUrl(params: MapsLinkParams): string {
  const query = buildMapsSearchQuery(params);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildAppleMapsUrl(params: MapsLinkParams): string {
  const query = buildMapsSearchQuery(params);
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}
