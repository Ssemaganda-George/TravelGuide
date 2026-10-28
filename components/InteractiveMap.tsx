"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { safeSrc } from "@/lib/media";
import type { Media } from "@/lib/data";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { Eye, Heart, MessageSquare, Building } from "lucide-react";
import StayModal from "@/components/StayModal";

interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  markers?: MapMarker[];
  interactive?: boolean;
  scrollWheelZoom?: boolean;
  className?: string;
  referencePoint?: ReferencePoint;
  country?: string;
  viewCounts?: Record<string, number>;
  engagement?: Record<string, Engagement>;
  staysCount?: Record<string, number>;
  activitiesByPlace?: Record<string, Activity[]>;
}

interface ReferencePoint {
  name: string;
  position: [number, number];
}

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  description?: string | null;
  contact?: string | null;
  email?: string | null;
  website?: string | null;
  thumbnail?: string | null;
  media?: string[];
  travelTime?: string | null;
  durationMin?: number | null;
  category?: "stay" | "activity" | "service" | "destination" | "reference";
  tier?: string | null;
  link?: string;
  type?: string;
  ideal_days?: number | null;
  best_months?: string | null;
  hook?: string | null;
  place_id?: string;
}

interface Engagement {
  likes: number;
  reviews: number;
  avgRating: number;
}

interface Activity {
  id: string;
  name: string;
  media: Media[] | null;
  place_id?: string;
}

interface RouteData {
  destinationId: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

function getCustomIcon(category?: string, isSelected = false) {
  const colors: Record<string, string> = {
    destination: "#0E6B6B",
    stay: "#F59E0B",
    activity: "#EF4444",
    service: "#8B5CF6",
    reference: "#10B981",
  };
  const color = colors[category || "destination"] || "#0E6B6B";
  
  const icons: Record<string, string> = {
    destination: "📍",
    stay: "🏨",
    activity: "🎯",
    service: "🛠️",
    reference: "🏛️",
  };
  const icon = icons[category || "destination"] || "📍";

  const size = category === "reference" ? 36 : (isSelected ? 32 : 28);
  const borderWidth = isSelected ? 4 : 3;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        <span style="transform: rotate(45deg); font-size: ${category === "reference" ? 14 : 10}px; color: white;">${icon}</span>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 0 ${color}; }
          70% { box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 10px transparent; }
          100% { box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 0 transparent; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function MarkerLayer({ 
  markers, 
  onMarkerClick, 
  selectedId,
  onMarkerHover,
  onMarkerLeave
}: { 
  markers: MapMarker[]; 
  onMarkerClick: (marker: MapMarker) => void;
  selectedId: string | null;
  onMarkerHover: (marker: MapMarker) => void;
  onMarkerLeave: () => void;
}) {
  return (
    <>
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={marker.position} 
          icon={getCustomIcon(marker.category, marker.id === selectedId)}
          eventHandlers={{
            click: () => onMarkerClick(marker),
            mouseover: () => onMarkerHover(marker),
            mouseout: onMarkerLeave,
          }}
        />
      ))}
    </>
  );
}

function MarkerPopup({ marker }: { marker: MapMarker }) {
  const thumbnail = marker.thumbnail ? safeSrc(marker.thumbnail!) : null;
  
  if (marker.category === "reference") {
    return (
      <div className="map-popup reference-popup" style={{ minWidth: 200, padding: 0 }}>
        <div style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏛️</div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--ink)" }}>{marker.name}</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Reference point (capital city)</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.75rem", color: "var(--lake)", fontWeight: 500 }}>Routes to all destinations shown</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="map-popup" style={{ minWidth: 220, padding: 0 }}>
      {thumbnail && (
        <img 
          src={thumbnail} 
          alt={marker.name} 
          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "8px 8px 0 0" }}
        />
      )}
      <div style={{ padding: 12 }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "var(--ink)" }}>{marker.name}</h4>
        {marker.hook && (
          <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.4 }}>{marker.hook}</p>
        )}
        {marker.travelTime && (
          <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "var(--muted)" }}>
            ⏱️ {marker.travelTime}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {marker.tier && (
            <span style={{ 
              display: "inline-block", 
              padding: "2px 8px", 
              background: "var(--mist)", 
              color: "var(--lake)", 
              borderRadius: "999px", 
              fontSize: "0.7rem", 
              fontWeight: 600,
            }}>
              {marker.tier}
            </span>
          )}
          {marker.type && (
            <span style={{ 
              display: "inline-block", 
              padding: "2px 8px", 
              background: "var(--mist)", 
              color: "var(--lake)", 
              borderRadius: "999px", 
              fontSize: "0.7rem", 
              fontWeight: 600,
            }}>
              {marker.type}
            </span>
          )}
          {marker.ideal_days && (
            <span style={{ 
              display: "inline-block", 
              padding: "2px 8px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.7rem", 
              fontWeight: 600,
            }}>
              {marker.ideal_days} days
            </span>
          )}
          {marker.best_months && (
            <span style={{ 
              display: "inline-block", 
              padding: "2px 8px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.7rem", 
              fontWeight: 600,
            }}>
              Best: {marker.best_months}
            </span>
          )}
        </div>
        {marker.link && (
          <a 
            href={marker.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 4,
              padding: "10px 16px",
              background: "var(--lake)",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              width: "100%",
              textAlign: "center",
              boxSizing: "border-box",
              touchAction: "manipulation",
            }}
          >
            View Details
          </a>
        )}
      </div>
    </div>
  );
}

function DestinationCard({ 
  marker, 
  onClose, 
  onNavigate,
  onExploreStay,
  viewCounts,
  engagement,
  staysCount,
  activitiesByPlace,
  country,
  routes,
  referencePoint
}: { 
  marker: MapMarker; 
  onClose: () => void;
  onNavigate: (link: string) => void;
  onExploreStay: (marker: MapMarker) => void;
  viewCounts: Record<string, number>;
  engagement: Record<string, Engagement>;
  staysCount: Record<string, number>;
  activitiesByPlace: Record<string, Activity[]>;
  country: string;
  routes: RouteData[];
  referencePoint: ReferencePoint | undefined;
}) {
  const path = marker.link || `/${country}/${marker.place_id}`;
  const viewCount = viewCounts[path] ?? 0;
  const eng = engagement[marker.place_id || ""] ?? { likes: 0, reviews: 0, avgRating: 0 };
  const stays = staysCount[marker.place_id || ""] ?? 0;
  const acts = activitiesByPlace[marker.place_id || ""] ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const images = marker.media?.filter(Boolean) ?? (marker.thumbnail ? [marker.thumbnail] : []);

  // Prefer stored duration_min from database, fallback to route calculation
  const route = routes.find(r => r.destinationId === marker.id);
  const distanceKm = route ? (route.distance / 1000).toFixed(1) : null;
  
  // Format duration from stored minutes (database) or route (runtime)
  const durationMinutes = marker.durationMin ?? (route ? Math.round(route.duration / 60) : null);
  const durationStr = durationMinutes ? (() => {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    if (hours === 0) return `~${mins} min`;
    if (mins === 0) return `~${hours} hr${hours > 1 ? 's' : ''}`;
    return `~${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  })() : null;
  
  const coverUrl = useMemo(() => {
    const cover = acts.find(a => (a.media ?? []).some(m => safeSrc(m.url ?? ""))) ?? null;
    return cover ? safeSrc((cover.media ?? [])[0].url ?? "") : null;
  }, [acts]);
  
  const thumbnail = marker.thumbnail ? safeSrc(marker.thumbnail!) : coverUrl;
  
  return (
    <div className="map-destination-card" style={{
      position: "absolute",
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 1000,
      maxWidth: 400,
      margin: "0 auto",
      background: "white",
      borderRadius: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      overflow: "hidden",
      border: "1px solid var(--mist)",
      animation: "slideUp 0.3s ease-out",
    }}>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={{ position: "relative" }}>
        {images.length > 0 ? (
          <div style={{ width: "100%", height: 240, position: "relative", overflow: "hidden", borderRadius: "16px 16px 0 0", background: "var(--mist)" }}>
            <img 
              src={images[imageIndex]} 
              alt={marker.name} 
              style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1)); }}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "1rem",
                    lineHeight: 1,
                    zIndex: 10,
                    touchAction: "manipulation",
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1)); }}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "1rem",
                    lineHeight: 1,
                    zIndex: 10,
                    touchAction: "manipulation",
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
                <div style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  zIndex: 10,
                }}>
                  {imageIndex + 1} of {images.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ width: "100%", height: 240, background: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", borderRadius: "16px 16px 0 0" }}>
            📍
          </div>
        )}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
          {acts.length > 0 && (
            <span style={{ 
              padding: "4px 10px", 
              background: "rgba(0,0,0,0.7)", 
              color: "white", 
              borderRadius: "999px", 
              fontSize: "0.7rem", 
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {acts.length} Activities
            </span>
          )}
          <button 
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              touchAction: "manipulation",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      
       <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)", flex: 1, paddingRight: 12 }}>{marker.name}</h4>
          {stays > 0 && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              <Building size={12} /> {stays} Stays
            </span>
          )}
        </div>
        {marker.hook && (
          <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.5 }}>{marker.hook}</p>
        )}
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {durationStr && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 500,
            }}>
              ⏱️ {durationStr}
            </span>
          )}
          {distanceKm && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--lake)", 
              color: "white", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 600,
            }}>
              📍 {distanceKm} km
            </span>
          )}
          {marker.tier && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--mist)", 
              color: "var(--lake)", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 600,
            }}>
              {marker.tier}
            </span>
          )}
          {marker.ideal_days && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 500,
            }}>
              {marker.ideal_days} days
            </span>
          )}
          {marker.best_months && (
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 4,
              padding: "4px 10px", 
              background: "var(--mist)", 
              color: "var(--ink)", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 500,
            }}>
              Best: {marker.best_months}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--mist)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)" }} title="Views">
            <Eye size={14} /> {viewCount}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)" }} title="Likes">
            <Heart size={14} strokeWidth={2} fill={eng.likes > 0 ? "var(--sun)" : "none"} style={{ color: eng.likes > 0 ? "var(--sun)" : "var(--muted)" }} /> {eng.likes}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--lake)", cursor: "pointer" }} title="Reviews" onClick={() => onNavigate(`${path}/reviews`)}>
            <MessageSquare size={14} /> {eng.reviews > 0 ? `${eng.avgRating.toFixed(1)} (${eng.reviews})` : "Review"}
          </span>
        </div>
        
        {marker.link && (
          <button
            onClick={() => {
              if (marker.category === "stay") {
                onExploreStay(marker);
              } else {
                onNavigate(marker.link!);
              }
            }}
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: "12px 20px",
              background: "var(--lake)",
              color: "white",
              border: "none",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
              touchAction: "manipulation",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#0B5A5A"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--lake)"}
          >
            {marker.category === "stay" ? "Explore stay" : marker.category === "activity" ? "Explore activity" : "Explore destination"}
          </button>
        )}
      </div>
    </div>
  );
}

function RouteLayer({ 
  routes, 
  referencePoint,
  onRouteHover,
  onRouteLeave 
}: { 
  routes: RouteData[];
  referencePoint: ReferencePoint;
  onRouteHover: (route: RouteData) => void;
  onRouteLeave: () => void;
}) {
  return (
    <>
      {routes.map((route) => (
        <Polyline
          key={route.destinationId}
          positions={route.coordinates}
          color="#0E6B6B"
          weight={4}
          opacity={0.8}
          dashArray="10, 5"
          eventHandlers={{
            mouseover: () => onRouteHover(route),
            mouseout: onRouteLeave,
          }}
        />
      ))}
    </>
  );
}

function RouteTooltip({ route, referencePoint }: { route: RouteData | null; referencePoint: ReferencePoint }) {
  if (!route) return null;
  
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationHours = Math.floor(route.duration / 3600);
  const durationMinutes = Math.round((route.duration % 3600) / 60);
  const durationStr = durationHours > 0 
    ? `${durationHours}h ${durationMinutes}m`
    : `${durationMinutes}m`;

  return (
    <div className="route-tooltip" style={{
      position: "fixed",
      background: "var(--ink)",
      color: "white",
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: "0.85rem",
      fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      zIndex: 1000,
      pointerEvents: "none",
      whiteSpace: "nowrap",
      border: "2px solid #0E6B6B",
    }}>
      <div>{referencePoint.name} → Destination</div>
      <div style={{ display: "flex", gap: "16px", marginTop: 4 }}>
        <span>📏 {distanceKm} km</span>
        <span>⏱️ {durationStr}</span>
      </div>
    </div>
  );
}

export default function InteractiveMap({ 
  center, 
  zoom = 8, 
  height = "400px", 
  markers = [], 
  interactive = true,
  scrollWheelZoom = true,
  className = "",
  referencePoint,
  country,
  viewCounts = {},
  engagement = {},
  staysCount = {},
  activitiesByPlace = {},
}: MapProps) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [hoveredRoute, setHoveredRoute] = useState<RouteData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDestinationCard, setShowDestinationCard] = useState<MapMarker | null>(null);
  const [showStayModal, setShowStayModal] = useState(false);
  const [selectedStay, setSelectedStay] = useState<MapMarker | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const setMapRef = (map: any) => {
    mapRef.current = map;
  };

  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      // Center on the first destination marker (not the capital)
      const destinationMarker = markers.find(m => m.category === "destination") || markers[0];
      if (destinationMarker) {
        mapRef.current.setView(destinationMarker.position, zoom, { animate: true });
      }
    }
  }, [markers, referencePoint, zoom]);

  useEffect(() => {
    if (!referencePoint || markers.length === 0) return;

    const fetchRoutes = async () => {
      const routePromises = markers
        .filter(m => m.category === "destination")
        .map(async (marker) => {
          try {
            const [startLat, startLng] = referencePoint.position;
            const [endLat, endLng] = marker.position;
            const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
              return {
                destinationId: marker.id,
                coordinates,
                distance: route.distance,
                duration: route.duration,
              };
            }
          } catch (e) {
            console.warn("Failed to fetch route for", marker.name, e);
          }
          return null;
        });

      const results = await Promise.all(routePromises);
      setRoutes(results.filter((r): r is RouteData => r !== null));
    };

    fetchRoutes();
  }, [markers, referencePoint]);

  const handleRouteHover = useCallback((route: RouteData) => {
    setHoveredRoute(route);
  }, []);

  const handleRouteLeave = useCallback(() => {
    setHoveredRoute(null);
    setTooltipPosition(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (hoveredRoute) {
      setTooltipPosition({ x: e.clientX + 16, y: e.clientY + 16 });
    }
  }, [hoveredRoute]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    if (marker.category === "reference") {
      setSelectedMarker(marker);
      setShowDestinationCard(null);
      setShowStayModal(false);
    } else if (marker.category === "stay") {
      setSelectedStay(marker);
      setShowStayModal(true);
      setShowDestinationCard(null);
      setSelectedMarker(null);
    } else {
      setSelectedMarker(marker);
      setShowDestinationCard(marker);
      setShowStayModal(false);
    }
  }, []);

  const handleMarkerHover = useCallback((marker: MapMarker) => {
    if (marker.category !== "reference") {
      setHoveredMarker(marker);
    }
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredMarker(null);
  }, []);

  const handleNavigate = useCallback((link: string) => {
    router.push(link);
    setShowDestinationCard(null);
    setSelectedMarker(null);
  }, [router]);

  const handleCloseCard = useCallback(() => {
    setShowDestinationCard(null);
    setSelectedMarker(null);
  }, []);

  const allMarkers = referencePoint 
    ? [
        { 
          id: "reference", 
          position: referencePoint.position, 
          name: referencePoint.name, 
          category: "reference" as const,
          travelTime: "Reference point",
        },
        ...markers
      ]
    : markers;

  return (
    <div 
      className={`interactive-map ${className}`} 
      style={{ height, borderRadius: 12, overflow: "hidden", position: "relative", touchAction: interactive ? "auto" : "pan-x pan-y" }}
      onMouseMove={handleMouseMove}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive ? scrollWheelZoom : false}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        ref={setMapRef as any}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.length > 0 && referencePoint && (
          <RouteLayer
            routes={routes}
            referencePoint={referencePoint}
            onRouteHover={handleRouteHover}
            onRouteLeave={handleRouteLeave}
          />
        )}
        {allMarkers.length > 0 && (
          <MarkerLayer 
            markers={allMarkers} 
            onMarkerClick={handleMarkerClick}
            selectedId={selectedMarker?.id || null}
            onMarkerHover={handleMarkerHover}
            onMarkerLeave={handleMarkerLeave}
          />
        )}
      </MapContainer>
      
      {hoveredRoute && tooltipPosition && (
        <RouteTooltip route={hoveredRoute} referencePoint={referencePoint!} />
      )}
      
      {showDestinationCard && (
        <DestinationCard 
          marker={showDestinationCard} 
          onClose={handleCloseCard}
          onNavigate={handleNavigate}
          onExploreStay={(m) => {
            setSelectedStay(m);
            setShowStayModal(true);
            setShowDestinationCard(null);
          }}
          viewCounts={viewCounts || {}}
          engagement={engagement || {}}
          staysCount={staysCount || {}}
          activitiesByPlace={activitiesByPlace || {}}
          country={country || ""}
          routes={routes}
          referencePoint={referencePoint}
        />
      )}
      
      {selectedMarker?.category === "reference" && !showDestinationCard && (
        <div className="map-selected-info" style={{ 
          position: "absolute", 
          bottom: 16, 
          left: 16, 
          right: 16,
          zIndex: 1000 
        }}>
          <MarkerPopup marker={selectedMarker} />
        </div>
      )}

      {showStayModal && selectedStay && (
        <StayModal
          open={showStayModal}
          onClose={() => setShowStayModal(false)}
          stay={{
            id: selectedStay.id.replace("stay-", ""),
            name: selectedStay.name,
            description: selectedStay.description ?? null,
            contact: selectedStay.contact ?? null,
            email: selectedStay.email ?? null,
            website: selectedStay.website ?? null,
            media: selectedStay.media,
            tier: selectedStay.tier ?? null,
          }}
        />
      )}
    </div>
  );
}