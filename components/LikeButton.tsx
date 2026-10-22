"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  placeId: string;
  initialLikes: number;
  initialLiked: boolean;
}

export function LikeButton({ placeId, initialLikes, initialLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
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
        // Revert on error
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

  return (
    <button
      className="likestat"
      onClick={toggleLike}
      disabled={loading}
      aria-label={liked ? "Unlike" : "Like"}
      title="Like"
      style={{ cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", padding: "4px 8px", fontSize: "0.9rem", color: "var(--ink)" }}
    >
      <Heart
        className={liked ? "liked" : ""}
        size={18}
        strokeWidth={liked ? 0 : 2}
        fill={liked ? "var(--sun)" : "none"}
      />
      <span>{likes}</span>
    </button>
  );
}
