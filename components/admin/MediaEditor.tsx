"use client";
import { useId } from "react";
import type { Media } from "@/lib/data";

export type MediaDraft = { type: "image" | "video"; url: string; caption: string };

export const toDraft = (m: Media[] | null | undefined): MediaDraft[] =>
  (m ?? []).map(x => ({ type: x?.type === "video" ? "video" : "image", url: x?.url ?? "", caption: x?.caption ?? "" }));

// Reusable photo/video rows for one activity or lodge. YouTube/Vimeo links and
// direct image/video URLs all work; the parent serializes the rows on save.
export default function MediaEditor({ items, onChange }: { items: MediaDraft[]; onChange: (next: MediaDraft[]) => void }) {
  const uid = useId();
  const set = (i: number, patch: Partial<MediaDraft>) =>
    onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
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
            <label htmlFor={`${uid}u${i}`}>{m.type === "video" ? "Video link" : "Image link"}</label>
            <input id={`${uid}u${i}`} value={m.url}
              placeholder={m.type === "video" ? "YouTube or Vimeo link, or .mp4 URL" : "https://..."}
              onChange={e => set(i, { url: e.target.value })} />
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
