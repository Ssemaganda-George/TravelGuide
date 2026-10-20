"use client";
import { useState } from "react";
import { safeSrc } from "@/lib/media";
import type { Media } from "@/lib/data";
import MediaGallery from "@/components/MediaGallery";

type Props = { media: Media[] | null };

export default function StayImages({ media }: Props) {
  const items = (media ?? []).filter(m => m && m.url);
  if (!items.length) return null;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = items[index];
  const showNav = items.length > 1;
  return (
    <div className="stayimages" onClick={() => setOpen(true)} style={{ position: "relative", width: "100%", height: 180, overflow: "hidden", borderRadius: "10px", background: "var(--mist)", cursor: "pointer" }}>
      <img src={safeSrc(current.url) ?? ""} alt={current.caption ?? ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {showNav && (
        <>
          <button className="staynav stayprev" onClick={e => { e.stopPropagation(); setIndex((index - 1 + items.length) % items.length); }} aria-label="Previous image">‹</button>
          <button className="staynav staynext" onClick={e => { e.stopPropagation(); setIndex((index + 1) % items.length); }} aria-label="Next image">›</button>
          <div className="stayindex">{index + 1} / {items.length}</div>
        </>
      )}
      {open && <MediaGallery items={items} />}
    </div>
  );
}
