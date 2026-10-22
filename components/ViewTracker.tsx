"use client";

import { useEffect } from "react";

export function ViewTracker({ path }: { path: string }) {
  useEffect(() => {
    fetch("/api/view", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  return null;
}
