"use client";
import { useState, useEffect } from "react";
import type { Activity } from "@/lib/data";
import MediaEditor, { toDraft, type MediaDraft } from "./MediaEditor";

type Provider = { id: string; name: string; type: string; contact: string | null };

type Draft = {
  id?: string; name: string; description: string;
  cost_low: string; cost_high: string; duration: string; media: MediaDraft[]; providerIds: string[];
};

const blank = (): Draft => ({ name: "", description: "", cost_low: "", cost_high: "", duration: "", media: [], providerIds: [] });

// Lets the guide manage "Things to do" on the destination page: each activity gets
// a description, a rough cost, photos/videos, and one or more provider partners.
export default function ActivitiesEditor({ initial, providers }: { initial: Activity[]; providers: Provider[] }) {
  const [items, setItems] = useState<Draft[]>(() => (initial ?? []).map(a => ({
    id: a.id, name: a.name ?? "", description: a.description ?? "",
    cost_low: a.cost_low != null ? String(a.cost_low) : "",
    cost_high: a.cost_high != null ? String(a.cost_high) : "",
    duration: a.duration ?? "", media: toDraft(a.media),
    providerIds: (a.providers ?? []).map(p => p.id),
  })));
  const patch = (i: number, p: Partial<Draft>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const n = (v: string) => (v.trim() === "" || isNaN(Number(v)) ? null : Number(v));

  return (
    <div className="items">
      {items.map((a, i) => (
        <div className="item" key={i}>
          <div className="ihead">
            <strong>{a.name || `Activity ${i + 1}`}</strong>
            <button type="button" className="chip" onClick={() => setItems(items.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <label htmlFor={`an${i}`}>Name</label>
          <input id={`an${i}`} value={a.name} placeholder="White-water rafting" onChange={e => patch(i, { name: e.target.value })} />
          <label htmlFor={`ad${i}`}>What it is</label>
          <textarea id={`ad${i}`} rows={3} value={a.description} placeholder="Full day on the rapids, lunch included. Grades from gentle to wild." onChange={e => patch(i, { description: e.target.value })} />
          <div className="row2">
            <div><label htmlFor={`al${i}`}>Cost from ($)</label><input id={`al${i}`} type="number" min="0" step="1" value={a.cost_low} onChange={e => patch(i, { cost_low: e.target.value })} /></div>
            <div><label htmlFor={`ah${i}`}>Cost to ($)</label><input id={`ah${i}`} type="number" min="0" step="1" value={a.cost_high} onChange={e => patch(i, { cost_high: e.target.value })} /></div>
            <div><label htmlFor={`au${i}`}>How long</label><input id={`au${i}`} value={a.duration} placeholder="Full day" onChange={e => patch(i, { duration: e.target.value })} /></div>
          </div>
          <label>Photos and videos</label>
          <MediaEditor items={a.media} onChange={media => patch(i, { media })} />
          <label>Providers (partners who run this activity)</label>
          <select id={`ap${i}`} multiple size={4} onChange={e => {
            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
            patch(i, { providerIds: selected });
          }}>
            {providers.map(p => (
              <option key={p.id} value={p.id} selected={a.providerIds.includes(p.id)}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>
      ))}
      <div className="madd">
        <button type="button" className="chip" onClick={() => setItems([...items, blank()])}>+ Add activity</button>
      </div>
      <input type="hidden" name="activities_json" value={JSON.stringify(items
        .filter(a => a.name.trim() || a.media.some(m => m.url.trim()))
        .map(a => ({
          id: a.id, name: a.name.trim(), description: a.description.trim(),
          cost_low: n(a.cost_low), cost_high: n(a.cost_high), duration: a.duration.trim(),
          providerIds: a.providerIds,
          media: a.media.filter(m => m.url.trim()).map(m => ({ type: m.type, url: m.url.trim(), caption: m.caption.trim() })),
        })))} />
    </div>
  );
}
