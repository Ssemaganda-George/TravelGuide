"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import logoImg from "@/logo/logo.png";

export default function SiteHeader() {
  const path = usePathname() || "";
  if (path === "/" || path === "/uganda" || path.startsWith("/uganda?")) return null;
  return (
    <header className="site-header">
      <div className="wrap">
        <a href="/" className="brand" aria-label="Travel Guide - Home">
          <img src={logoImg.src} alt="" className="brand-img" width="64" height="64" />
          <span className="brand-text">Travel Guide</span>
        </a>
      </div>
    </header>
  );
}
