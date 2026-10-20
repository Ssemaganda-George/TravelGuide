"use client";
import { useState } from "react";
import { safeSrc } from "@/lib/media";
import type { Media } from "@/lib/data";

type Props = { media: Media[] | null };

export default function StayImages({ media }: Props) {
  const items = (media ?? []).filter(m => m && m.url);
  if (!items.length) return null;
  const [index, setIndex] = useState(0);
  const current = items[index];
  const showNav = items.length > 1;
  return (
    <div className="stayimages" style={{ position: "relative", width: "100%", height: 180, overflow: "hidden", borderRadius: "10px", background: "var(--mist)" }}>
      <img src={safeSrc(current.url) ?? ""} alt={current.caption ?? ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {showNav && (
        <>
          <button className="staynav stayprev" onClick={() => setIndex((index - 1 + items.length) % items.length)} aria-label="Previous image">‹</button>
          <button className="staynav staynext" onClick={() => setIndex((index + 1) % items.length)} aria-label="Next image">›</button>
          <div className="stayindex">{index + 1} / {items.length}</div>
        </>
      )}
    </div>
  );
}
