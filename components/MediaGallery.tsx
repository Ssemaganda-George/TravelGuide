"use client";
import { embedUrl } from "@/lib/media";
import type { Media } from "@/lib/data";
import { useState } from "react";

// Full-screen lightbox carousel: large images, scroll left/right between them.
function Lightbox({ media, startIndex, onClose }: { media: Media[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const m = media[index];
  const isVideo = m.type === "video";
  const mediaSrc = embedUrl(m.url) ?? m.url;
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); setIndex((index - 1 + media.length) % media.length); }}>‹</button>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <div className="lightbox-counter">{index + 1} / {media.length}</div>
        {isVideo ? (
          <div style={{ maxWidth: 900, maxHeight: "70vh" }}>
            {embedUrl(m.url) ? (
              <iframe src={mediaSrc} title={m.caption ?? "Video"} allowFullScreen style={{ width: "100%", height: "100%" }} />
            ) : (
              <video src={mediaSrc} controls playsInline style={{ width: "100%", height: "100%" }} />
            )}
          </div>
        ) : (
          <img src={mediaSrc} alt={m.caption ?? ""} style={{ maxWidth: "90vw", maxHeight: "75vh", objectFit: "contain", borderRadius: 8, border: "1px solid rgba(255,255,255,.2)", background: "#000" }} />
        )}
        {m.caption && <p className="lightbox-caption">{m.caption}</p>}
      </div>
      <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); setIndex((index + 1) % media.length); }}>›</button>
      <div className="lightbox-thumbs">
        {media.map((mm, i) => (
          <button
            key={i}
            className={i === index ? "active" : ""}
            onClick={e => { e.stopPropagation(); setIndex(i); }}
            style={{ backgroundImage: `url(${mm.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
      </div>
    </div>
  );
}

// Gallery for activity/lodge photos and videos. Images scroll horizontally;
// click any image to view it full screen in a scrollable lightbox.
export default function MediaGallery({ items }: { items: Media[] | null }) {
  const media = (items ?? []).filter(m => m && m.url);
  if (!media.length) return null;
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  return (
    <div className="shots">
      {media.map((m, i) => m.type === "video" ? (
        <figure key={i} className="vid" onClick={() => { setCurrent(i); setOpen(true); }}>
          {embedUrl(m.url)
            ? <iframe src={embedUrl(m.url)!} title={m.caption ?? "Video"} loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen />
            : <video src={m.url} controls preload="metadata" playsInline />}
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </figure>
      ) : (
        <figure key={i} onClick={() => { setCurrent(i); setOpen(true); }} className="clickable">
          <img src={m.url} alt={m.caption ?? ""} loading="lazy" />
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </figure>
      ))}
      {open && <Lightbox media={media} startIndex={current} onClose={() => setOpen(false)} />}
    </div>
  );
}
