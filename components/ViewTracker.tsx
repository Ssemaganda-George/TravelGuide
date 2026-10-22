"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ path }: { path: string }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    fetch("/api/view", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  return null;
}
