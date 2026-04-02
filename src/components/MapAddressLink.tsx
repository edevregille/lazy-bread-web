'use client';

import { useEffect, useState } from 'react';
import {
  buildAppleMapsUrl,
  buildGoogleMapsSearchUrl,
  isIOSUserAgent,
} from '@/lib/mapsLinks';

type MapAddressLinkProps = {
  address: string;
  className?: string;
};

export default function MapAddressLink({
  address,
  className = '',
}: MapAddressLinkProps) {
  const params = { address };

  const [href, setHref] = useState(() => buildGoogleMapsSearchUrl(params));

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const nextParams = { address };
    setHref(
      isIOSUserAgent(navigator.userAgent)
        ? buildAppleMapsUrl(nextParams)
        : buildGoogleMapsSearchUrl(nextParams),
    );
  }, [address]);

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
