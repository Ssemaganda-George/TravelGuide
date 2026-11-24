'use client';
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useInternalDevice } from "@/lib/useInternalDevice";

export default function PageView() {
  const path = usePathname();
  const internal = useInternalDevice();
  const first = useRef(true);
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    if (lastPath.current === path) return;
    try {
      const viewed = JSON.parse(sessionStorage.getItem("pv:viewed") ?? "[]");
      if (Array.isArray(viewed) && viewed.includes(path)) return;
      sessionStorage.setItem("pv:viewed", JSON.stringify([...viewed, path]));
    } catch {
      // sessionStorage unavailable — fall back to ref dedup only
    }
    lastPath.current = path;
    const utm = new URLSearchParams(location.search).get("utm_source") ?? "";
    const referrer = first.current ? document.referrer : ""; // only the entry page has an outside referrer
    first.current = false;
    fetch("/api/view", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, referrer, utm, internal }) }).catch(() => {});
  }, [path, internal]);
  return null;
}