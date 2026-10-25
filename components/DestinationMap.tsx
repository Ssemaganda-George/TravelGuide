"use client";

import dynamic from "next/dynamic";
import { COUNTRY_REFERENCE_POINTS } from "@/lib/data";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), { ssr: false });

interface DestinationMapProps {
  center: [number, number];
  markers: any[];
  zoom?: number;
  height?: string;
  className?: string;
  country?: string;
}

export default function DestinationMap({ 
  center, 
  markers, 
  zoom = 13, 
  height = "350px", 
  className = "",
  country
}: DestinationMapProps) {
  const referencePoint = country ? COUNTRY_REFERENCE_POINTS[country] : undefined;

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", height, width: "100%", pointerEvents: "auto" }}>
      <InteractiveMap
        center={center}
        zoom={zoom}
        height={height}
        markers={markers}
        interactive={true}
        scrollWheelZoom={true}
        className={`destination-minimap ${className}`}
        referencePoint={referencePoint}
      />
    </div>
  );
}