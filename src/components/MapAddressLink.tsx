'use client';

import { useEffect, useState } from 'react';
import {
  buildAppleMapsUrl,
  buildGoogleMapsSearchUrl,
  isIOSUserAgent,
} from '@/lib/mapsLinks';

type MapAddressLinkProps = {
  address: string;
  coordinates?: { lat: number; lng: number };
  placeName?: string;
  className?: string;
};

export default function MapAddressLink({
  address,
  coordinates,
  placeName,
  className = '',
}: MapAddressLinkProps) {
  const params = {
    address,
    coordinates,
    label: placeName ?? address,
  };

  const [href, setHref] = useState(() => buildGoogleMapsSearchUrl(params));

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const nextParams = {
      address,
      coordinates,
      label: placeName ?? address,
    };
    setHref(
      isIOSUserAgent(navigator.userAgent)
        ? buildAppleMapsUrl(nextParams)
        : buildGoogleMapsSearchUrl(nextParams),
    );
  }, [address, coordinates, placeName]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      suppressHydrationWarning
      aria-label={`Open in maps: ${address}`}
      className={`underline decoration-bakery-primary/60 underline-offset-2 hover:decoration-bakery-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bakery-primary rounded-sm ${className}`}
    >
      {address}
    </a>
  );
}
