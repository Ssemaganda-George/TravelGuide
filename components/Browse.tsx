"use client";
import Link from "next/link";
import { useState } from "react";
import type { Dest } from "@/lib/data";

export default function Browse({ country, items }: { country: string; items: Dest[] }) {
  const [tag, setTag] = useState("all");
  const tags = ["all", ...new Set(items.flatMap(i => i.tags))];
  const list = items.filter(i => tag === "all" || i.tags.includes(tag));
  return (
    <div className="wrap">
      <div className="chips" role="group" aria-label="Filter destinations">
        {tags.map(t => <button key={t} className="chip" aria-pressed={t === tag} onClick={() => setTag(t)}>{t === "all" ? "All destinations" : t}</button>)}
      </div>
      {list.length ? (
        <div className="grid">{list.map(i => (
          <Link key={i.id} className="card" href={`/${country}/${i.places.slug}`}>
            <h3>{i.title}</h3><p>{i.hook}</p>
            <span className="meta">{i.ideal_days ? `${i.ideal_days} days` : ""}{i.best_months ? ` · best ${i.best_months}` : ""}</span>
          </Link>))}
        </div>
      ) : <p className="empty">No destinations published yet. Check back soon.</p>}
    </div>
  );
}
