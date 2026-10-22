"use client";
import Link from "next/link";
import { useState } from "react";
import type { Activity, Dest, Engagement } from "@/lib/data";
import { safeSrc } from "@/lib/media";
import { Eye, Heart, Building } from "lucide-react";

type Props = {
  country: string;
  items: Dest[];
  activitiesByPlace: Record<string, Activity[]>;
  viewCounts: Record<string, number>;
  engagement: Record<string, Engagement>;
  staysCount: Record<string, number>;
};

export default function Browse({ country, items, activitiesByPlace, viewCounts, engagement: initialEngagement, staysCount }: Props) {
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [engagement, setEngagement] = useState<Record<string, Engagement>>(initialEngagement);
  const tags = ["all", ...new Set(items.flatMap(i => i.tags))];
  const list = items
    .slice()
    .sort((a, b) => (viewCounts[`/${country}/${b.places.slug}`] ?? 0) - (viewCounts[`/${country}/${a.places.slug}`] ?? 0))
    .filter(i => {
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
    setEngagement(prev => {
      const curr = prev[placeId] ?? { likes: 0, reviews: 0, avgRating: 0 };
      return {
        ...prev,
        [placeId]: {
          ...curr,
          likes: next ? curr.likes + 1 : Math.max(0, curr.likes - 1),
        },
      };
    });
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (!res.ok) {
        // Revert optimistic update on error
        setLiked(prev => {
          const n = new Set(prev);
          if (next) n.delete(placeId); else n.add(placeId);
          return n;
        });
        setEngagement(prev => {
          const curr = prev[placeId] ?? { likes: 0, reviews: 0, avgRating: 0 };
          return {
            ...prev,
            [placeId]: {
              ...curr,
              likes: next ? Math.max(0, curr.likes - 1) : curr.likes + 1,
            },
          };
        });
      }
    } catch {
      // Revert on network error
      setLiked(prev => {
        const n = new Set(prev);
        if (next) n.delete(placeId); else n.add(placeId);
        return n;
      });
      setEngagement(prev => {
        const curr = prev[placeId] ?? { likes: 0, reviews: 0, avgRating: 0 };
        return {
          ...prev,
          [placeId]: {
            ...curr,
            likes: next ? Math.max(0, curr.likes - 1) : curr.likes + 1,
          },
        };
      });
    }
  };

  return (
    <div className="wrap">
      <div className="searchbar" role="search" aria-label="Search destinations">
        <label style={{ display: "block", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--head),system-ui,sans-serif" }}>Search destinations</label>
        <input type="search" placeholder="gorillas, chimps, hiking" value={search} onChange={e => setSearch(e.target.value)} />
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
              <a href={`/${country}/${i.places.slug}`} className="cardlink">
                <div className="cardmedia">
                  {coverUrl ? (
                    <img src={coverUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="cardplaceholder">📍</div>
                  )}
                  <div className="cardoverlay">
                    <span className="cardbadge">Activities {acts.length}</span>
                  </div>
                </div>
                <div className="cardcontent">
                  <div className="cardhead">
                    <h3>{i.title}</h3>
                    <span className="stays-badge">{staysCount[i.place_id] ?? 0} Stays</span>
                  </div>
                  <p>{i.hook}</p>
                  <span className="cardmeta">{i.ideal_days ? `${i.ideal_days} days` : ""}{i.best_months ? ` · best ${i.best_months}` : ""}</span>
                  <div className="cardstats">
                    <span className="stat" title="Views"><Eye /> {viewCounts[path] ?? 0}</span>
                    <span className="stat likestat" title="Likes" onClick={e => toggleLike(i.place_id, e)} style={{ cursor: "pointer" }}>
                      <Heart className={isLiked ? "liked" : ""} size={16} strokeWidth={2} fill={isLiked ? "var(--sun)" : "none"} /> {eng.likes}
                    </span>
                    <span className="stat" title="Reviews" onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/${country}/${i.places.slug}/reviews`; }} style={{ cursor: "pointer", textDecoration: "none", color: "var(--lake)", transition: "color 0.2s, background-color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"} onTouchStart={(e) => e.currentTarget.style.textDecoration = "underline"} onTouchEnd={(e) => { setTimeout(() => { e.currentTarget.style.textDecoration = "none"; }, 300); }}>
                      {eng.reviews > 0 ? `${eng.avgRating} (${eng.reviews} reviews)` : "Review"}
                    </span>
                  </div>
                </div>
              </a>
            </article>
          );
        })}
        </div>
      ) : <p className="empty">No destinations match your search. Try another keyword.</p>}
    </div>
  );
}