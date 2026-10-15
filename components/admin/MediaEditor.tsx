"use client";
import { useId, useState } from "react";
import type { Media } from "@/lib/data";
import { uploadMedia } from "@/app/admin/actions";

export type MediaDraft = { type: "image" | "video"; url: string; caption: string };

export const toDraft = (m: Media[] | null | undefined): MediaDraft[] =>
  (m ?? []).map(x => ({ type: x?.type === "video" ? "video" : "image", url: x?.url ?? "", caption: x?.caption ?? "" }));

// Reusable photo/video rows for one activity or lodge. Each row takes a link
// (YouTube/Vimeo or direct URL) or a file uploaded to Supabase Storage; the
// parent serializes the rows on save.
export default function MediaEditor({ items, onChange }: { items: MediaDraft[]; onChange: (next: MediaDraft[]) => void }) {
  const uid = useId();
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (i: number, patch: Partial<MediaDraft>) =>
    onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const accept = (t: MediaDraft["type"]) => (t === "video" ? "video/*" : "image/*");

  const attachFile = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(i);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", items[i].type);
    const res = (await uploadMedia(fd)) as { error?: string; url?: string; path?: string };
    e.target.value = "";
    if (res.error) setError(res.error);
    else if (res.url) set(i, { url: res.url });
    setUploading(null);
  };

  return (
    <div className="media">
      {items.map((m, i) => (
        <div className="mrow" key={i}>
          <div>
            <label htmlFor={`${uid}t${i}`}>Type</label>
            <select id={`${uid}t${i}`} value={m.type} onChange={e => set(i, { type: e.target.value as MediaDraft["type"] })}>
              <option value="image">Photo</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}u${i}`}>{m.type === "video" ? "Video link" : "Image link"} (or attach a file)</label>
            <input id={`${uid}u${i}`} value={m.url}
              placeholder={m.type === "video" ? "YouTube or Vimeo link, or .mp4 URL" : "https://..."}
              onChange={e => set(i, { url: e.target.value })} />
            <label htmlFor={`${uid}f${i}`} className="file">Attach file</label>
            <input id={`${uid}f${i}`} type="file" accept={accept(m.type)} onChange={e => attachFile(i, e)} />
            {uploading === i && <span className="msg">Uploading…</span>}
            {error && <span className="msg err">{error}</span>}
          </div>
          <div>
            <label htmlFor={`${uid}c${i}`}>Caption (optional)</label>
            <input id={`${uid}c${i}`} value={m.caption} onChange={e => set(i, { caption: e.target.value })} />
          </div>
          <button type="button" className="chip" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div className="madd">
        <button type="button" className="chip" onClick={() => onChange([...items, { type: "image", url: "", caption: "" }])}>+ Photo</button>
        <button type="button" className="chip" onClick={() => onChange([...items, { type: "video", url: "", caption: "" }])}>+ Video</button>
      </div>
    </div>
  );
}
