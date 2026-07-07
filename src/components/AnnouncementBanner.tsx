"use client";

import { useEffect, useRef } from "react";
import { SITE_BANNER } from "@/config/app-config";
import { useConfig } from "@/contexts/ConfigContext";

/**
 * Site-wide alert bar shown under the fixed header on every page (e.g. an
 * upcoming closure heads-up). Sets a --banner-height CSS var on <html> so
 * the layout can push page content down by exactly the banner's rendered
 * height, since the message length (and therefore line count) varies.
 */
export default function AnnouncementBanner() {
  const { config } = useConfig();
  const siteBanner = config?.SITE_BANNER ?? SITE_BANNER;
  const isVisible = siteBanner.showBanner && siteBanner.messageBanner.trim().length > 0;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (!isVisible) {
      root.style.setProperty("--banner-height", "0px");
      return;
    }

    const updateHeight = () => {
      if (ref.current) {
        root.style.setProperty("--banner-height", `${ref.current.offsetHeight}px`);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      root.style.setProperty("--banner-height", "0px");
    };
  }, [isVisible, siteBanner.messageBanner]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="status"
      className="fixed top-20 inset-x-0 z-[9] bg-bakery-primary text-white text-sm sm:text-base font-body font-semibold text-center px-4 py-2.5 shadow-md"
    >
      {siteBanner.messageBanner}
    </div>
  );
}
