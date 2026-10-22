"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ path }: { path: string }) {
  const hasFired = useRef(false);

  useEffect(() => {
    // Don't track during prefetch - only track when page is actually visible
    if (typeof document !== "undefined" && (document.visibilityState as string) === "prerender") {
      return;
    }

    if (hasFired.current) return;
    hasFired.current = true;

    // Track visited paths in sessionStorage to avoid double-counting on back/forward
    const visitedKey = "viewed_paths";
    const visited = JSON.parse(sessionStorage.getItem(visitedKey) || "[]");
    if (visited.includes(path)) return;
    visited.push(path);
    sessionStorage.setItem(visitedKey, JSON.stringify(visited));

    fetch("/api/view", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  return null;
}
