"use client";

import { useMemo, useState } from "react";

interface Point { date: string; views: number; visitors: number; enquiries: number; }

interface TrendChartProps {
  data: Point[];
  start: string;
  end: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function TrendChart({ data, start, end }: TrendChartProps) {
  const points = useMemo(() => {
    const map = new Map<string, Point>();
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    e.setDate(e.getDate() + 1);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      map.set(key, { date: key, views: 0, visitors: 0, enquiries: 0 });
    }
    for (const p of data ?? []) {
      const existing = map.get(p.date);
      if (existing) {
        existing.views += p.views;
        existing.visitors += p.visitors;
        existing.enquiries += p.enquiries;
      } else {
        map.set(p.date, p);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, start, end]);

  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const maxViews = Math.max(...points.map(p => p.views), 1);
  const maxEnq = Math.max(...points.map(p => p.enquiries), 1);
  const maxY = Math.max(maxViews, maxEnq * 10);

  const w = 700;
  const h = 200;
  const pad = { top: 24, right: 20, bottom: 36, left: 44 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const x = (i: number) => pad.left + (i / Math.max(points.length - 1, 1)) * plotW;
  const y = (val: number) => pad.top + plotH - (val / maxY) * plotH;

  const lineViews = points.map((p, i) => `${x(i)},${y(p.views)}`).join(" ");
  const lineEnq = points.map((p, i) => `${x(i)},${y(p.enquiries * 10)}`).join(" ");

  const yTicks = [0, Math.round(maxY / 2), maxY];

  const hoveredPoint = hover != null ? points[hover] : null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2>Daily Trend</h2>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Daily views and enquiries trend"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const mx = e.clientX - rect.left;
          if (mx < pad.left || mx > pad.left + plotW) { setHover(null); return; }
          const idx = Math.round(((mx - pad.left) / plotW) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, idx)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E6B6B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0E6B6B" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="gradEnq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {yTicks.map((val, i) => (
          <line key={i} x1={pad.left} x2={pad.left + plotW} y1={y(val)} y2={y(val)} stroke="#e5e7eb" strokeWidth={1} />
        ))}
        <path
          d={`M${pad.left},${y(0)} ${lineViews} L${x(points.length - 1)},${y(0)} Z`}
          fill="url(#gradViews)"
          fillOpacity="0.25"
        />
        <path d={lineViews} fill="none" stroke="#0E6B6B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={lineEnq} fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />
        {yTicks.map((val, i) => (
          <text key={i} x={pad.left - 8} y={y(val) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
            {i === 2 ? Math.round(val) : i === 1 ? Math.round(val / 2) : 0}
          </text>
        ))}
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => {
          const p = points[i];
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={pad.top + plotH} y2={pad.top + plotH + 4} stroke="#e5e7eb" strokeWidth={1} />
              <text x={x(i)} y={pad.top + plotH + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
                {formatDay(p.date)}
              </text>
            </g>
          );
        })}
        {hoveredPoint && hover != null && (
          <g>
            {(() => {
              const hi = hover ?? 0;
              const hx = x(hi);
              return (
                <>
                  <circle cx={hx} cy={y(hoveredPoint.views)} r={4} fill="#0E6B6B" />
                  <circle cx={hx} cy={y(hoveredPoint.enquiries * 10)} r={4} fill="#F59E0B" />
                  <rect
                    x={hx - 60}
                    y={pad.top - 30}
                    width={120}
                    height={24}
                    fill="#111"
                    fillOpacity="0.85"
                    rx={4}
                  />
                  <text x={hx} y={pad.top - 12} textAnchor="middle" fontSize="11" fill="#fff">
                    {formatDay(hoveredPoint.date)} &bull; {hoveredPoint.views} views &bull; {hoveredPoint.enquiries} enquiries
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>
      <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#6b7280" }}>
        Hover a point for the daily reading &nbsp;•&nbsp; Solid teal = page views &nbsp;•&nbsp; Dashed orange = enquiries (&times;10 scale)
      </p>
    </section>
  );
}
