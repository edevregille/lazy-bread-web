export type MapsLinkParams = {
  address: string;
  /** Venue name prepended for clearer geocoding (e.g. "Café Eleven, 435 NE Rosa Parks…") */
  label?: string;
};

/** Human-readable string sent to map providers (not coordinates). */
export function buildMapsSearchQuery({ address, label }: MapsLinkParams): string {
  const a = address.trim();
  const l = label?.trim();
  if (l && l.length > 0 && l !== a) {
    return `${l}, ${a}`;
  }
  return a;
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
