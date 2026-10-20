"use client";
import Link from "next/link";
import { useState } from "react";
import type { Activity, Dest, Engagement } from "@/lib/data";
import { safeSrc } from "@/lib/media";

type Props = {
  country: string;
  items: Dest[];
  activitiesByPlace: Record<string, Activity[]>;
  viewCounts: Record<string, number>;
  engagement: Record<string, Engagement>;
};

const Eye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Heart = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "var(--sun)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: filled ? "var(--sun)" : "var(--muted)" }}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3.05 1.32-3.5 3.15-0.45-1.83-1.74-3.15-3.5-3.15A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z" />
  </svg>
);

const stars = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars" aria-label={rating.toFixed(1) + " of 5"}>
      {Array.from({ length: full }).map(() => "★")}
      {half && "☆"}
      {Array.from({ length: empty }).map(() => "☆")}
    </span>
  );
};

export default function Browse({ country, items, activitiesByPlace, viewCounts, engagement }: Props) {
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const tags = ["all", ...new Set(items.flatMap(i => i.tags))];
  const list = items.filter(i => {
    const byTag = tag === "all" || i.tags.includes(tag);
    const q = search.toLowerCase();
    const byText = !q || i.title.toLowerCase().includes(q) || (i.hook ?? "").toLowerCase().includes(q);
    return byTag && byText;
  });

  const registerView = (path: string) => {
    fetch("/api/view", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  };

  const toggleLike = async (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !liked.has(placeId);
    setLiked(prev => {
      const n = new Set(prev);
      if (next) n.add(placeId); else n.delete(placeId);
      return n;
    });
    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    }).catch(() => {
      setLiked(prev => {
        const n = new Set(prev);
        if (next) n.delete(placeId); else n.add(placeId);
        return n;
      });
    });
  };

  return (
    <div className="wrap">
      <div className="searchbar" role="search" aria-label="Search destinations">
        <label style={{ display: "block", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--head),system-ui,sans-serif" }}>Search trips &amp; packages</label>
        <input type="search" placeholder="e.g. gorilla trekking, source of the nile, ssesese islands" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="chip" onClick={() => setSearch("")} title="Clear" aria-label="Clear search" style={{ padding: "0 10px", borderRadius: "10px", fontSize: "1rem", lineHeight: "1", height: "auto", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>✕</button>
      </div>
      <div className="chips" role="group" aria-label="Filter destinations">
        {tags.map(t => <button key={t} className="chip" aria-pressed={t === tag} onClick={() => setTag(t)}>{t === "all" ? "All destinations" : t}</button>)}
      </div>
      <p className="meta" style={{ margin: "6px 0 24px" }}>{list.length} destination{list.length !== 1 ? "s" : ""} found</p>
      {list.length ? (
        <div className="grid">{list.map(i => {
          const acts = activitiesByPlace[i.place_id] ?? [];
          const cover = acts.find(a => (a.media ?? []).some(m => safeSrc(m.url ?? ""))) ?? null;
          const coverUrl = cover ? safeSrc((cover.media ?? [])[0].url ?? "") : null;
          const path = `/${country}/${i.places.slug}`;
          const eng = engagement[i.place_id] ?? { likes: 0, reviews: 0, avgRating: 0 };
          const isLiked = liked.has(i.place_id);
          return (
            <article key={i.id} className="card">
              <div className="cardwrapper">
                {coverUrl ? (
                <figure className="cardimg">
                  <img src={coverUrl} alt="" loading="lazy" />
                </figure>
              ) : (
                <figure className="cardimg cardimg-placeholder">
                  <span className="placeholder-icon">📍</span>
                </figure>
              )}
              <div className="cardbody">
                <div className="cardhead">
                  <h3>{i.title}</h3>
                  {acts.length > 0 && <span className="activitycount">{acts.length} activity{acts.length !== 1 ? "s" : ""}</span>}
                </div>
                <p>{i.hook}</p>
                <span className="meta">{i.ideal_days ? `${i.ideal_days} days` : ""}{i.best_months ? ` · best ${i.best_months}` : ""}</span>
                <div className="cardmetrics">
                  <span className="metric" title="Views"><Eye /> {viewCounts[path] ?? 0} <span className="metriclabel">views</span></span>
                  <span className="metric likemetric" title="Likes" onClick={e => toggleLike(i.place_id, e)} style={{ cursor: "pointer" }}>
                    <Heart filled={isLiked} /> {eng.likes} <span className="metriclabel">likes</span>
                  </span>
                  <span className="metric" title="Reviews" onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/${country}/${i.places.slug}/reviews`; }} style={{ cursor: "pointer" }}>{eng.reviews} <span className="metriclabel">reviews</span> {eng.reviews > 0 && stars(eng.avgRating)}</span>
                </div>
                <a href={`/${country}/${i.places.slug}`} className="cardcta">View details <span aria-hidden="true">→</span></a>
              </div>
              </div>
            </article>
          );
        })}
        </div>
      ) : <p className="empty">No destinations match your search. Try another keyword.</p>}
    </div>
  );
}
