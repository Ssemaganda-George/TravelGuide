import { embedUrl } from "@/lib/media";
import type { Media } from "@/lib/data";

// Gallery for activity/lodge photos and videos. Images flow in a responsive grid;
// YouTube/Vimeo links are embedded, other video URLs play in a native player.
export default function MediaGallery({ items }: { items: Media[] | null }) {
  const media = (items ?? []).filter(m => m && m.url);
  if (!media.length) return null;
  return (
    <div className="shots">
      {media.map((m, i) => m.type === "video" ? (
        <figure key={i} className="vid">
          {embedUrl(m.url)
            ? <iframe src={embedUrl(m.url)!} title={m.caption ?? "Video"} loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen />
            : <video src={m.url} controls preload="metadata" playsInline />}
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </figure>
      ) : (
        <figure key={i}>
          <img src={m.url} alt={m.caption ?? ""} loading="lazy" />
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
