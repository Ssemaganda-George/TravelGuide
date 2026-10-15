import type { Media } from "./data";

// Turns a pasted YouTube/Vimeo link into an embeddable URL. Returns null for direct video files.
export function embedUrl(url: string): string | null {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// Guards against rendering an empty or non-http(s) URL.
export function safeSrc(url: string): string | null {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : null;
}

export function cleanMedia(input: unknown): Media[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((m) => {
    const url = typeof m?.url === "string" ? m.url.trim() : "";
    const src = safeSrc(url);
    if (!src) return [];
    return [{
      type: m?.type === "video" ? ("video" as const) : ("image" as const),
      url: src,
      caption: typeof m?.caption === "string" && m.caption.trim() ? m.caption.trim() : null,
    }];
  });
}
