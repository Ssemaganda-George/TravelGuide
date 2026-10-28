"use client";

import { useState } from "react";
import { Eye, Heart, Star, Building, Activity } from "lucide-react";
import LikeStat from "@/components/LikeStat";

interface HeaderStatsProps {
  views: number;
  placeId: string;
  path: string;
  engagement: { likes: number; reviews: number; avgRating: number };
  staysCount: number;
  activitiesCount: number;
  inverse?: boolean;
}

const ICON_COLOR = "var(--lake)";
const STAR_COLOR = "var(--sun)";
const TEXT_COLOR = "var(--ink)";

export default function HeaderStats({ 
  views, placeId, path, engagement, staysCount, activitiesCount, inverse = false
}: HeaderStatsProps) {
  const iconColor = inverse ? "#fff" : ICON_COLOR;
  const starColor = inverse ? "#ffd54f" : STAR_COLOR;
  const textColor = inverse ? "rgba(255,255,255,.95)" : TEXT_COLOR;
  return (
    <div className="header-stats" style={{ color: textColor }}>
      <div className="stat clickable">
        <Eye className="stat-icon" size={14} strokeWidth={2} style={{ color: iconColor }} />
        <div>
          <span className="stat-label" style={{ color: textColor }}>{"Views"}</span>
          <span className="stat-value" style={{ color: textColor }}>{views}</span>
        </div>
      </div>
      <LikeStat placeId={placeId} initialLikes={engagement.likes} inverse={inverse} />
      <button className="stat clickable" onClick={() => window.location.href = `${path}/reviews`} style={{ cursor: "pointer", background: "none", border: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Star className="stat-icon" size={14} strokeWidth={2} fill={starColor} style={{ color: starColor }} />
        <div>
          <span className="stat-label" style={{ color: textColor }}>Reviews</span>
          <span className="stat-value" style={{ color: textColor }}>
            {engagement.reviews > 0 ? `${engagement.avgRating.toFixed(1)} (${engagement.reviews})` : "No reviews yet"}
          </span>
        </div>
      </button>
      <button className="stat clickable" onClick={() => document.getElementById("where-to-stay")?.scrollIntoView({ behavior: "smooth" })} disabled={staysCount === 0} style={{ cursor: staysCount === 0 ? "default" : "pointer", background: "none", border: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: staysCount === 0 ? 0.5 : 1 }}>
        <Building className="stat-icon" size={14} strokeWidth={2} style={{ color: iconColor }} />
        <div>
          <span className="stat-label" style={{ color: textColor }}>Stays Listed</span>
          <span className="stat-value" style={{ color: textColor }}>{staysCount}</span>
        </div>
      </button>
      <button className="stat clickable" onClick={() => document.getElementById("things-to-do")?.scrollIntoView({ behavior: "smooth" })} disabled={activitiesCount === 0} style={{ cursor: activitiesCount === 0 ? "default" : "pointer", background: "none", border: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: activitiesCount === 0 ? 0.5 : 1 }}>
        <Activity className="stat-icon" size={14} strokeWidth={2} style={{ color: iconColor }} />
        <div>
          <span className="stat-label" style={{ color: textColor }}>Activities</span>
          <span className="stat-value" style={{ color: textColor }}>{activitiesCount}</span>
        </div>
      </button>
    </div>
  );
}
