'use client';

import { useEffect } from 'react';
import { initDatadogRum } from '@/lib/datadogRum';

/**
 * Initializes Datadog RUM after the root layout injects datadog-rum.js (beforeInteractive).
 * Bots get sessionSampleRate 0 so crawler sessions are not sampled into RUM.
 */
export default function DatadogRumInit() {
  useEffect(() => {
    initDatadogRum();
  }, []);

  return null;
}
