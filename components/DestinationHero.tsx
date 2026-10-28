"use client";

import { useEffect, useState } from "react";
import HeaderStats from "@/components/HeaderStats";

interface DestinationHeroProps {
  images: string[];
  title: string;
  hook: string;
  views: number;
  placeId: string;
  path: string;
  engagement: { likes: number; reviews: number; avgRating: number };
  staysCount: number;
  activitiesCount: number;
}

export default function DestinationHero({ images, title, hook, views, placeId, path, engagement, staysCount, activitiesCount }: DestinationHeroProps) {
  const [i, setI] = useState(0);
  const image = images[i % images.length];

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <section className="dest-hero" style={{ position: "relative", minHeight: "55vh", overflow: "hidden" }}>
      <div
        className="dest-hero-bg"
        style={{
          position: "absolute",
          inset: 0,
          background: image ? `url('${image}') center/cover no-repeat` : "transparent",
          filter: "brightness(0.88)",
          zIndex: 0,
          transition: "opacity 1s ease",
        }}
      />
      <div className="dest-hero-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.12), rgba(0,0,0,.32))", zIndex: 1 }} />
      <div className="dest-hero-content" style={{ position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto", padding: "120px 20px 60px", textAlign: "center", color: "#fff" }}>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.6rem)", margin: "0 0 10px", fontWeight: 800, letterSpacing: "-0.5px" }}>{title}</h1>
        <p style={{ fontSize: "clamp(1rem,2.5vw,1.3rem)", margin: "0 0 20px", opacity: .95, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>{hook}</p>
        <div style={{ display: "inline-flex", gap: 16, justifyContent: "center", alignItems: "center", fontSize: "0.95rem", opacity: 1 }}>
          <HeaderStats
            views={views}
            placeId={placeId}
            path={path}
            engagement={engagement}
            staysCount={staysCount}
            activitiesCount={activitiesCount}
            inverse
          />
        </div>
      </div>
    </section>
  );
}
