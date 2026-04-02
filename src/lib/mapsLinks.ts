export type MapsLinkParams = {
  address: string;
  coordinates?: { lat: number; lng: number };
  /** Used as Apple Maps search label when coordinates exist */
  label?: string;
};

export function isIOSUserAgent(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}

export function buildGoogleMapsSearchUrl({
  address,
  coordinates,
}: MapsLinkParams): string {
  const query =
    coordinates != null
      ? `${coordinates.lat},${coordinates.lng}`
      : address.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildAppleMapsUrl({
  address,
  coordinates,
  label,
}: MapsLinkParams): string {
  const qLabel = (label ?? address).trim();
  if (coordinates != null) {
    const { lat, lng } = coordinates;
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(qLabel)}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(address.trim())}`;
}
