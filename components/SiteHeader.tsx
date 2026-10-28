"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SiteHeader() {
  const path = usePathname() || "";
  if (path === "/" || path === "/uganda" || path.startsWith("/uganda?")) return null;
  return (
    <header className="site-header">
      <div className="wrap">
        <a href="/" className="brand" aria-label="Travel Guide - Home">
          <img src="/logo/logo1.png" alt="Travel Guide" style={{ width: 180, height: "auto", borderRadius: "10px", padding: 6, display: "block", objectFit: "contain" }} />
        </a>
      </div>
    </header>
  );
}
