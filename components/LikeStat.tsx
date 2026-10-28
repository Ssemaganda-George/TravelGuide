"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

interface LikeStatProps {
  placeId: string;
  initialLikes: number;
  inverse?: boolean;
}

export default function LikeStat({ placeId, initialLikes, inverse = false }: LikeStatProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (loading) return;
    setLoading(true);
    const next = !liked;
    setLiked(next);
    setLikes(prev => next ? prev + 1 : Math.max(0, prev - 1));
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (!res.ok) {
        setLiked(!next);
        setLikes(prev => next ? prev - 1 : prev + 1);
      }
    } catch {
      setLiked(!next);
      setLikes(prev => next ? prev - 1 : prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const heartFill = inverse ? (liked ? "#ffd54f" : "none") : (liked ? "var(--sun)" : "none");
  const heartColor = inverse ? (liked ? "#ffd54f" : "rgba(255,255,255,.7)") : (liked ? "var(--sun)" : "inherit");
  const textColor = inverse ? "rgba(255,255,255,.95)" : "inherit";

  return (
    <button className="stat clickable" onClick={toggleLike} disabled={loading} style={{ cursor: loading ? "not-allowed" : "pointer", background: "none", border: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: textColor }}>
      <Heart className="stat-icon" size={14} strokeWidth={liked ? 0 : 2} fill={heartFill} style={{ color: heartColor }} />
      <div>
        <span className="stat-label" style={{ color: textColor }}>Likes</span>
        <span className="stat-value" style={{ color: textColor }}>{likes}</span>
      </div>
    </button>
  );
}
