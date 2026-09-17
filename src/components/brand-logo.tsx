"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  invert?: boolean;
}

export function BrandLogo({ className, markClassName, showWordmark = true, invert = false }: BrandLogoProps) {
  const gradientId = `syncro-purple-${useId().replace(/:/g, "")}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 72 72"
        aria-hidden="true"
        className={cn("h-9 w-9 shrink-0", markClassName)}
      >
        <defs>
          <linearGradient id={gradientId} x1="8" y1="12" x2="62" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B16D8" />
            <stop offset="1" stopColor="#A98AF5" />
          </linearGradient>
        </defs>
        <path d="M20 12 9 23c-4 4-4 10 0 14l17 17c4 4 10 4 14 0l10-10-9-9-7 7-11-11 8-8z" fill={`url(#${gradientId})`} />
        <path d="m52 60 11-11c4-4 4-10 0-14L46 18c-4-4-10-4-14 0L22 28l9 9 7-7 11 11-8 8z" fill={`url(#${gradientId})`} />
        <path d="M18 31 29 20c4-4 10-4 14 0l12 12-8 8-12-12-9 9z" fill="#C2B6FF" />
        <path d="m54 41-11 11c-4 4-10 4-14 0L17 41l8-8 12 12 9-9z" fill="#3A0F99" />
        <path d="M6 28c-2 4-1 10 3 14l7 7 5-5-8-8c-3-3-5-5-7-8z" fill="#9BE3E9" />
        <path d="M66 44c2-4 1-10-3-14l-7-7-5 5 8 8c3 3 5 5 7 8z" fill="#9BE3E9" />
      </svg>
      {showWordmark && (
        <span className={cn("text-sm font-bold tracking-[0.08em]", invert ? "text-white" : "text-foreground")}>
          SYNCRO
        </span>
      )}
    </div>
  );
}
