import { safeSrc } from "@/lib/media";

const IMAGE_MD = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

// Renders the story. A paragraph that is only an image link (or ![caption](url)
// syntax) becomes a photo inside the narrative instead of a text paragraph.
export default function Story({ text }: { text: string | null }) {
  const normalized = (text ?? "").replace(/\r\n?/g, "\n");
  let blocks = normalized.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
  // Fallback: if no double newlines, split on single newlines
  if (blocks.length === 1 && normalized.includes("\n")) {
    blocks = normalized.split("\n").map(b => b.trim()).filter(Boolean);
  }
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((b, i) => {
        const md = [...b.matchAll(IMAGE_MD)].map(m => ({ caption: m[1].trim() || null, url: safeSrc(m[2]) }));
        if (md.length && md.every(x => x.url)) {
          return (
            <div className="shots" key={i}>
              {md.map((img, j) => (
                <figure key={j}>
                  <img src={img.url!} alt={img.caption ?? ""} loading="lazy" />
                  {img.caption && <figcaption>{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          );
        }
        const url = /^https?:\/\/\S+$/.test(b) ? safeSrc(b) : null;
        if (url) return (
          <figure className="shot" key={i}>
            <img src={url} alt="" loading="lazy" />
          </figure>
        );
        return <p key={i}>{b}</p>;
      })}
    </>
  );
}
