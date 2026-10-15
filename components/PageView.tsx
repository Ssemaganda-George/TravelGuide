"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Sends one anonymous view per page. Bots that don't run JavaScript are never counted.
export default function PageView() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const utm = new URLSearchParams(location.search).get("utm_source") ?? "";
    const referrer = first.current ? document.referrer : ""; // only the entry page has an outside referrer
    first.current = false;
    fetch("/api/view", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, referrer, utm }) }).catch(() => {});
  }, [path]);
  return null;
}
