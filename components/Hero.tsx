"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

const SCENES = [
  { title: "Discover Uganda’s Most Amazing Destinations", sub: "Mountain lakes, misty peaks, and backpacker trails.", bg: "linear-gradient(135deg,#1e3a2f 0%,#2d5a3d 40%,#6b8e5a 100%)" },
  { title: "Real Places. Real Stories.", sub: "Encounter mountain gorillas in lush ancient forest.", bg: "linear-gradient(135deg,#0b2e1f 0%,#1f4d33 45%,#3f7a4a 100%)" },
  { title: "Plan Smarter. Travel Better.", sub: "Golden sunsets over still waters.", bg: "linear-gradient(135deg,#3a2a10 0%,#7a5a1f 40%,#c9a227 100%)" },
  { title: "Every Journey Starts with Curiosity", sub: "Scenic mountain roads and safari vehicles await.", bg: "linear-gradient(135deg,#1a2533 0%,#2e4a6b 45%,#6b8fa3 100%)" },
];

export default function Hero({ country = "uganda", search = "", setSearch, tag = "all", setTag, tags = [], images = [] }: { country?: string; search?: string; setSearch?: (v: string) => void; tag?: string; setTag?: (v: string) => void; tags?: string[]; images?: string[]; }) {
  const [i, setI] = useState(0);
  const actionList = (tags && tags.length) ? ["All destinations", ...tags.filter((t: string) => t !== "all")] : ["All destinations", "culture", "wildlife", "adventure", "gorillas", "relaxing", "chimps", "birds"];
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % Math.max(images.length, SCENES.length)), 6000);
    return () => clearInterval(t);
  }, [images.length]);
  const scene = SCENES[i % SCENES.length];
  const heroImage = images[i % images.length] || null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Hero scenes"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: heroImage ? `url('${heroImage}') center/cover no-repeat` : scene.bg,
        color: "#fff",
        overflow: "hidden",
        transition: "background 1.2s ease",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.55))" }} />
      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 180, maxWidth: "60vw" }}>
          <img src="/logo/logo1.png" alt="Travel Guide" style={{ width: "100%", height: "auto", borderRadius: "10px", padding: 8, display: "block", objectFit: "contain" }} />
        </div>
        <div style={{ width: 180 }} />
      </nav>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 20px", textAlign: "center", width: "100%" }}>
        <h1 style={{ fontSize: "clamp(2rem,6vw,3.6rem)", margin: "0 0 12px", fontWeight: 700 }}>{scene.title}</h1>
        <p style={{ fontSize: "clamp(1rem,2.5vw,1.25rem)", margin: "0 0 28px", opacity: .9 }}>{scene.sub}</p>
        <form role="search" aria-label="Destination search" action={`/${country}`} method="get" style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 999, padding: "6px 6px 6px 16px", maxWidth: 560, margin: "0 auto 24px", boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
          <Search size={20} color="#666" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch?.(e.target.value)} placeholder="gorillas, chimps, hiking" aria-label="Search destinations" style={{ flex: 1, border: "none", outline: "none", padding: "10px 12px", fontSize: 16, background: "transparent", color: "#222" }} />
          <button type="submit" aria-label="Search" style={{ background: "#2e7d32", border: "none", borderRadius: 999, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowRight size={20} color="#fff" />
          </button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {actionList.map((label) => {
            const isActive = (label === "All destinations" && tag === "all") || label === tag;
            return (
              <button key={label} type="button" onClick={() => setTag?.(label === "All destinations" ? "all" : label)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isActive ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.35)", color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: 13, cursor: "pointer", backdropFilter: "blur(6px)" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
