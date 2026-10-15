"use client";
import { useState } from "react";
import type { Stay } from "@/lib/data";
import { STAY_TIERS } from "@/lib/tiers";
import MediaEditor, { toDraft, type MediaDraft } from "./MediaEditor";

type Draft = { id?: string; name: string; tier: string; description: string; contact: string; media: MediaDraft[] };

const blank = (): Draft => ({ name: "", tier: "mid", description: "", contact: "", media: [] });

// "Where to stay" on the destination page: lodges by budget tier, each with a
// one-line blurb and photos or videos. Lodges are stored as partners so enquiries
// and commissions stay connected.
export default function LodgesEditor({ initial }: { initial: Stay[] }) {
  const [items, setItems] = useState<Draft[]>(() => (initial ?? []).map(s => ({
    id: s.id, name: s.name ?? "", tier: s.tier ?? "mid", description: s.description ?? "",
    contact: s.contact ?? "", media: toDraft(s.media),
  })));
  const patch = (i: number, p: Partial<Draft>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="items">
      {items.map((l, i) => (
        <div className="item" key={i}>
          <div className="ihead">
            <strong>{l.name || `Stay ${i + 1}`}</strong>
            <button type="button" className="chip" onClick={() => setItems(items.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <div className="row2">
            <div><label htmlFor={`ln${i}`}>Name</label><input id={`ln${i}`} value={l.name} placeholder="Nile side camp" onChange={e => patch(i, { name: e.target.value })} /></div>
            <div><label htmlFor={`lt${i}`}>Tier</label>
              <select id={`lt${i}`} value={l.tier} onChange={e => patch(i, { tier: e.target.value })}>
                {STAY_TIERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor={`ld${i}`}>One line about it</label>
          <input id={`ld${i}`} value={l.description} placeholder="Riverside bandas with a campfire, walking distance to town." onChange={e => patch(i, { description: e.target.value })} />
          <label htmlFor={`lc${i}`}>Contact (optional)</label>
          <input id={`lc${i}`} value={l.contact} placeholder="WhatsApp or email" onChange={e => patch(i, { contact: e.target.value })} />
          <label>Photos and videos</label>
          <MediaEditor items={l.media} onChange={media => patch(i, { media })} />
        </div>
      ))}
      <div className="madd">
        <button type="button" className="chip" onClick={() => setItems([...items, blank()])}>+ Add stay</button>
      </div>
      <input type="hidden" name="lodges_json" value={JSON.stringify(items
        .filter(l => l.name.trim() || l.media.some(m => m.url.trim()))
        .map(l => ({
          id: l.id, name: l.name.trim(), tier: l.tier, description: l.description.trim(),
          contact: l.contact.trim(),
          media: l.media.filter(m => m.url.trim()).map(m => ({ type: m.type, url: m.url.trim(), caption: m.caption.trim() })),
        })))} />
    </div>
  );
}
