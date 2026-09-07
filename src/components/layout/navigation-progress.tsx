"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress — minimal delay, no spinner
NProgress.configure({ showSpinner: false, minimum: 0.15, speed: 280, trickleSpeed: 100 });

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startProgress = useCallback(() => {
    NProgress.start();
  }, []);

  const stopProgress = useCallback(() => {
    NProgress.done();
  }, []);

  // Stop on route change complete
  useEffect(() => {
    stopProgress();
  }, [pathname, searchParams, stopProgress]);

  // Start on link click — intercept all <a> clicks on the page
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || target.target === "_blank") return;
      if (href === pathname) return; // same page
      startProgress();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startProgress]);

  return null;
}
