"use client";

import { useState } from "react";
import DestinationMap from "@/components/DestinationMap";

interface FullMapModalWrapperProps {
  title: string;
  center: [number, number];
  markers: any[];
  country: string;
  buttonLabel?: string;
}

export default function FullMapModalWrapper({ title, center, markers, country, buttonLabel = "🗺️ View full map" }: FullMapModalWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="map-button"
      >
        {buttonLabel}
      </button>
      {isOpen && (
        <div className="map-modal-overlay" onClick={() => setIsOpen(false)} style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()} style={{
            width: "100%",
            maxWidth: "1200px",
            height: "80vh",
            maxHeight: "800px",
            background: "white",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>🗺️ {title} — Stays & Activities</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "2rem",
                  cursor: "pointer",
                  color: "var(--muted)",
                  lineHeight: 1,
                  padding: "4px 8px",
                }}
                aria-label="Close map"
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, pointerEvents: "auto" }}>
              <DestinationMap
                center={center}
                markers={markers}
                zoom={13}
                height="100%"
                className="destination-modal-map"
                country={country}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}