import { useEffect, useState } from "react";
import type { ResolvedConfig, Side } from "./types.js";

/**
 * Returns true when viewport width is at or below the breakpoint.
 * SSR-safe: defaults to false (desktop).
 */
export function useIsMobile(breakpoint: number): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

/** Resolve the current side from config + viewport. */
export function useResolvedSide(config: ResolvedConfig): Side {
  const isMobile = useIsMobile(config.breakpoint);
  return isMobile ? config.side.mobile : config.side.desktop;
}
