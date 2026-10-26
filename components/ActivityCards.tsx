"use client";

import { useState } from "react";
import Image from "next/image";
import ActivityModal from "@/components/ActivityModal";

interface ActivityCardsProps {
  activities: any[];
  country: string;
  placeId: string;
  destinationTitle: string;
}

export default function ActivityCards({ activities, country, placeId, destinationTitle }: ActivityCardsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  return (
    <>
      <section className="reviews-activities">
        <div className="activity-cards">
          {activities.map(a => (
            <article key={a.id} className="activity-card">
              <div className="activity-card-media">
                {(a.media ?? []).length > 0 ? (
                  <div
                    onClick={() => { setSelectedActivity(a); setModalOpen(true); }}
                    style={{ cursor: "pointer" }}
                  >
                    <Image
                      src={(a.media ?? [])[0].url}
                      alt={a.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="activity-card-img"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="activity-card-placeholder">📍</div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedActivity(a); setModalOpen(true); }}
                  className="activity-card-link"
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    background: "var(--lake)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    zIndex: 5,
                  }}
                >
                  Explore activity
                </button>
              </div>
              <div className="activity-card-body">
                <h3>{a.name}</h3>
                <div className="activity-card-meta">
                  {a.cost_low != null && a.cost_high != null && <span>$${a.cost_low} &ndash; $${a.cost_high}</span>}
                  {a.duration && <span>&bull; {a.duration}</span>}
                </div>
                {a.description && <p className="activity-card-desc">{a.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <ActivityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activity={selectedActivity ?? { id: "", name: "" }}
        placeId={placeId}
        destinationTitle={destinationTitle}
        country={country}
      />
    </>
  );
}
