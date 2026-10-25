"use client";

import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Activity, Dest, Engagement } from "@/lib/data";
import { safeSrc } from "@/lib/media";
import { Eye, Heart, Building, Map, List, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { COUNTRY_REFERENCE_POINTS } from "@/lib/data";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), { ssr: false });

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  thumbnail?: string;
  media?: string[];
  travelTime?: string;
  category?: "destination";
  link?: string;
}

type Props = {
  country: string;
  items: Dest[];
  activitiesByPlace: Record<string, Activity[]>;
  viewCounts: Record<string, number>;
  engagement: Record<string, Engagement>;
  staysCount: Record<string, number>;
  staysByPlace: Record<string, any[]>;
};

export default function Browse({ country, items, activitiesByPlace, viewCounts, engagement: initialEngagement, staysCount, staysByPlace }: Props) {
  const [tag, setTag] = useState("all");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [engagement, setEngagement] = useState<Record<string, Engagement>>(initialEngagement);
  const [showMap, setShowMap] = useState(false);
  
  const searchParams = useSearchParams();
  const destinationSlug = searchParams.get("destination");
  
  // Auto-enable map view if destination parameter is present
  useEffect(() => {
    if (destinationSlug && !showMap) {
      setShowMap(true);
    }
  }, [destinationSlug, showMap]);
  
  // Find the specific destination if slug is provided
  const targetDestination = useMemo(() => {
    if (!destinationSlug) return null;
    return items.find(i => i.places.slug === destinationSlug) || null;
  }, [items, destinationSlug]);
  
  const tags = ["all", ...new Set(items.flatMap(i => i.tags))];
  
  const filteredItems = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => (viewCounts[`/${country}/${b.places.slug}`] ?? 0) - (viewCounts[`/${country}/${a.places.slug}`] ?? 0))
      .filter(i => {
        const byTag = tag === "all" || i.tags.includes(tag);
        const q = search.toLowerCase();
        const byText = !q || i.title.toLowerCase().includes(q) || (i.hook ?? "").toLowerCase().includes(q);
        return byTag && byText;
      });
  }, [items, tag, search, country, viewCounts]);

  // Build map markers from filtered destinations
  const mapMarkers = useMemo(() => {
    const baseMarkers = (targetDestination ? [targetDestination] : filteredItems)
      .filter(i => i.latitude != null && i.longitude != null)
      .map(i => {
    // Fall back to first activity image for destination card thumbnails
    const acts = activitiesByPlace[i.place_id] || [];
    const media = acts.flatMap(a => (a.media ?? []).map(m => m.url).filter(Boolean));
    const thumbnail = media[0] ?? i.media?.[0]?.url ?? null;
    
    // Compute duration from distance: 1 min/km + terrain & traffic multipliers
    let durationMinutes = i.duration_min ?? null;
    let travelTimeStr = null;
    if (durationMinutes) {
      const h = Math.floor(durationMinutes / 60);
      const m = durationMinutes % 60;
      travelTimeStr = h === 0 ? `${m} min` : m === 0 ? `${h} hr` : `${h} hr ${m} min`;
    }
    
    return {
      id: i.id,
      place_id: i.place_id,
      position: [i.latitude!, i.longitude!] as [number, number],
      name: i.title,
      thumbnail: thumbnail ? safeSrc(thumbnail) : undefined,
      media: media.length ? media : (i.media ?? []).map(m => m.url).filter(Boolean),
      travelTime: travelTimeStr,
      durationMin: durationMinutes,
      category: "destination" as const,
      link: `/${country}/${i.places.slug}`,
      ideal_days: i.ideal_days,
      best_months: i.best_months,
      hook: i.hook,
    };
      });

    // Add stays and activities markers for target destination
    if (targetDestination) {
      const stays = staysByPlace[targetDestination.place_id] || [];
      const activities = activitiesByPlace[targetDestination.place_id] || [];
      
      const stayMarkers = stays
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => ({
          id: `stay-${s.id}`,
          place_id: targetDestination.place_id,
          position: [s.latitude!, s.longitude!] as [number, number],
          name: s.name,
          thumbnail: s.media?.[0]?.url ? safeSrc(s.media[0].url!) : undefined,
          travelTime: undefined,
          durationMin: undefined,
          category: "stay" as const,
          tier: s.tier,
          link: `/${country}/${targetDestination.places.slug}#stay-${s.id}`,
          type: "Stay",
        }));

      const activityMarkers = activities
        .filter(a => a.latitude != null && a.longitude != null)
        .map(a => ({
          id: `activity-${a.id}`,
          place_id: targetDestination.place_id,
          position: [a.latitude!, a.longitude!] as [number, number],
          name: a.name,
          thumbnail: a.media?.[0]?.url ? safeSrc(a.media[0].url!) : undefined,
          travelTime: undefined,
          durationMin: undefined,
          category: "activity" as const,
          type: "Activity",
          link: `/${country}/${targetDestination.places.slug}#activity-${a.id}`,
        }));

      return [...baseMarkers, ...stayMarkers, ...activityMarkers];
    }

    return baseMarkers;
  }, [filteredItems, country, targetDestination, staysByPlace, activitiesByPlace]);

  // Get reference point for this country (capital/major city)
  const referencePoint = useMemo(() => {
    return COUNTRY_REFERENCE_POINTS[country] || null;
  }, [country]);

  // Calculate map center - use target destination if specified, otherwise average of filtered
  const mapCenter = useMemo(() => {
    if (targetDestination && targetDestination.latitude != null && targetDestination.longitude != null) {
      return [targetDestination.latitude, targetDestination.longitude] as [number, number];
    }
    const withCoords = filteredItems.filter(i => i.latitude != null && i.longitude != null);
    if (withCoords.length === 0) return [1.3733, 32.2903] as [number, number]; // Uganda center
    const lat = withCoords.reduce((sum, i) => sum + (i.latitude || 0), 0) / withCoords.length;
    const lng = withCoords.reduce((sum, i) => sum + (i.longitude || 0), 0) / withCoords.length;
    return [lat, lng] as [number, number];
  }, [filteredItems, targetDestination]);

  // Calculate appropriate zoom - zoom in closer for specific destination
  const mapZoom = useMemo(() => {
    if (targetDestination) return 13; // Close zoom for specific destination
    const withCoords = filteredItems.filter(i => i.latitude != null && i.longitude != null);
    if (withCoords.length <= 1) return 8;
    const lats = withCoords.map(i => i.latitude!);
    const lngs = withCoords.map(i => i.longitude!);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    if (maxSpread > 5) return 6;
    if (maxSpread > 2) return 7;
    if (maxSpread > 1) return 8;
    return 9;
  }, [filteredItems, targetDestination]);

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

  const listView = (
    <div className="grid">
      {filteredItems.map(i => {
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
                  <span className="stat" title="Reviews" onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/${country}/${i.places.slug}/reviews`; }} style={{ cursor: "pointer", textDecoration: "none", color: "var(--lake)", transition: "color 0.2s" }}>
                    <MessageSquare size={14} /> {eng.reviews > 0 ? `${eng.avgRating.toFixed(1)} (${eng.reviews})` : "Review"}
                  </span>
                </div>
              </div>
            </a>
          </article>
        );
      })}
    </div>
  );

  const emptyView = <p className="empty">No destinations match your search. Try another keyword.</p>;

  const listContent = filteredItems.length > 0 ? listView : emptyView;

  return (
    <div className="wrap">
      <div className="searchbar" role="search" aria-label="Search destinations">
        <label style={{ display: "block", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--head),system-ui,sans-serif" }}>Search destinations</label>
        <input type="search" placeholder="gorillas, chimps, hiking" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="chip" onClick={() => setSearch("")} title="Clear" aria-label="Clear search" style={{ padding: "0 10px", borderRadius: "10px", fontSize: "1rem", lineHeight: "1", height: "auto", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>✕</button>
      </div>
      <div className="chips" role="group" aria-label="Filter destinations">
        {tags.map(t => <button key={t} className="chip" aria-pressed={t === tag} onClick={() => setTag(t)}>{t === "all" ? "All destinations" : t}</button>)}
        <button 
          key="map-toggle"
          className={`chip ${showMap ? "active" : ""}`} 
          aria-pressed={showMap}
          onClick={() => setShowMap(!showMap)}
          style={{ marginLeft: "auto" }}
        >
          {showMap ? (
            <>
              <List size={14} /> View List
            </>
          ) : (
            <>
              <Map size={14} /> View on Map
            </>
          )}
        </button>
      </div>
      <p className="meta" style={{ margin: "6px 0 24px" }}>{showMap ? "Map view" : `${filteredItems.length} destination${filteredItems.length !== 1 ? "s" : ""} found`}</p>
      
      {showMap ? (
        <div className="map-container" style={{ borderRadius: 16, overflow: "hidden", marginTop: 16 }}>
          <Suspense fallback={<div style={{ height: "600px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading map...</div>}>
            <InteractiveMap
              center={mapCenter}
              zoom={mapZoom}
              height="600px"
              markers={mapMarkers}
              interactive={true}
              scrollWheelZoom={true}
              className="homepage-map"
              referencePoint={referencePoint}
              country={country}
              viewCounts={viewCounts}
              engagement={engagement}
              staysCount={staysCount}
              activitiesByPlace={activitiesByPlace}
            />
          </Suspense>
        </div>
      ) : (
        listContent
      )}
    </div>
  );
}

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  thumbnail?: string;
  media?: string[];
  travelTime?: string;
  durationMin?: number | null;
  category?: "destination";
  link?: string;
}