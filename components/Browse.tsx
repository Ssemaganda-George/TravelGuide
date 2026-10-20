"use client";
import Link from "next/link";
import { useState } from "react";
import type { Activity, Dest } from "@/lib/data";
import { safeSrc } from "@/lib/media";

export default function Browse({ country, items, activitiesByPlace }: { country: string; items: Dest[]; activitiesByPlace: Record<string, Activity[]> }) {
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");
  const tags = ["all", ...new Set(items.flatMap(i => i.tags))];
  const list = items.filter(i => {
    const byTag = tag === "all" || i.tags.includes(tag);
    const q = search.toLowerCase();
    const byText = !q || i.title.toLowerCase().includes(q) || (i.hook ?? "").toLowerCase().includes(q);
    return byTag && byText;
  });
  return (
    <div className="wrap">
      <div className="searchbar" role="search" aria-label="Search destinations">
        <label style={{ display: "block", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--head),system-ui,sans-serif" }}>Search trips &amp; packages</label>
        <input type="search" placeholder="e.g. gorilla trekking, source of the nile, ssesese islands" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="chip" onClick={() => setSearch("")} title="Clear" aria-label="Clear search" style={{ padding: "0 10px", borderRadius: "10px", fontSize: "1rem", lineHeight: "1", height: "auto", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>✕</button>
      </div>
      <div className="chips" role="group" aria-label="Filter destinations">
        {tags.map(t => <button key={t} className="chip" aria-pressed={t === tag} onClick={() => setTag(t)}>{t === "all" ? "All destinations" : t}</button>)}
      </div>
      <p className="meta" style={{ margin: "6px 0 18px" }}>{list.length} destination{list.length !== 1 ? "s" : ""} found</p>
      {list.length ? (
        <div className="grid">{list.map(i => {
          const acts = activitiesByPlace[i.place_id] ?? [];
          const cover = acts.find(a => (a.media ?? []).some(m => safeSrc(m.url ?? ""))) ?? null;
          const coverUrl = cover ? safeSrc((cover.media ?? [])[0].url ?? "") : null;
          return (
            <Link key={i.id} className="card" href={`/${country}/${i.places.slug}`}>
              {coverUrl ? (
                <figure className="cardimg">
                  <img src={coverUrl} alt="" loading="lazy" />
                </figure>
              ) : null}
              <div className="cardbody">
                <div className="cardhead">
                  <h3>{i.title}</h3>
                  {acts.length > 0 && <span className="activitycount">{acts.length} activity{acts.length !== 1 ? "s" : ""}</span>}
                </div>
                <p>{i.hook}</p>
                <span className="meta">{i.ideal_days ? `${i.ideal_days} days` : ""}{i.best_months ? ` · best ${i.best_months}` : ""}</span>
              </div>
            </Link>
          );
        })}
        </div>
      ) : <p className="empty">No destinations match your search. Try another keyword.</p>}
    </div>
  );
}
