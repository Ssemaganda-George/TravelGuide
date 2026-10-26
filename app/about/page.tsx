"use client";

import Image from "next/image";
import { useState } from "react";

export default function About() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  return (
    <main className="wrap page about-page">
      <header className="about-header">
        <h1>About Trip Insights</h1>
        <p className="about-sub">Honest Uganda travel guides — real costs, real travel times, local tips from a Kampala-based guide.</p>
      </header>

      <section className="about-section">
        <h2>Who we are</h2>
        <p>
          Trip Insights is run by George, a Kampala-based guide and tech person who takes travellers around Uganda and beyond. These are the honest tips he gives his own clients — real costs, real travel times, and local knowledge you won&rsquo;t find in glossy brochures.
        </p>
        <p>
          I built this site because planning a trip to Uganda shouldn&rsquo;t be guesswork. Whether you&rsquo;re heading to Bwindi for gorillas, Sipi Falls for waterfalls, Kidepo for remote wilderness, or Jinja for the source of the Nile, you deserve to know what to expect before you go.
        </p>
      </section>

      <section className="about-section">
        <h2>Meet the team</h2>
        <div className="team-grid">
          <div className="team-card">
            <div
              className="team-image-wrap"
              onClick={() => { setSelectedImage("/team/George.jpg"); setModalOpen(true); }}
              style={{ cursor: "pointer" }}
            >
              <Image src="/team/George.jpg" alt="George" className="team-image" width={160} height={160} />
            </div>
            <div className="team-name">George</div>
            <div className="team-role">Founder &amp; Lead Guide</div>
            <p className="team-bio">Kampala-based guide and tech person who takes travellers around Uganda and beyond. Real costs, real travel times, local knowledge you won&rsquo;t find in glossy brochures.</p>
            <div className="team-contact">
              <a href="mailto:ssgeorge480@gmail.com" aria-label="Email" className="team-social">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
              <a href="https://wa.me/256759918649" aria-label="WhatsApp" className="team-social">
                <img src="/logo/whatsap.png" alt="WhatsApp" width="16" height="16" />
              </a>
              <a href="https://www.linkedin.com/in/ssemaganda-george/" target="_blank" rel="noopener noreferrer" aria-label="George LinkedIn" className="team-social">
                <img src="/logo/Linkedin.png" alt="LinkedIn" width="16" height="16" />
                LinkedIn
              </a>
            </div>
          </div>
          <div className="team-card">
            <div
              className="team-image-wrap"
              onClick={() => { setSelectedImage("/team/Winnie.jpg"); setModalOpen(true); }}
              style={{ cursor: "pointer" }}
            >
              <Image src="/team/Winnie.jpg" alt="Winnie" className="team-image" width={160} height={160} />
            </div>
            <div className="team-name">Winnie</div>
            <div className="team-role">CFO &amp; Chief Editor — Destination Content</div>
            <p className="team-bio">Winnie oversees all destination content on Trip Insights, ensuring every guide, review, and recommendation is accurate, up to date, and written from firsthand experience.</p>
            <div className="team-contact">
              <a href="https://www.linkedin.com/in/winfred-nandete-7821a5180/" target="_blank" rel="noopener noreferrer" aria-label="Winnie LinkedIn" className="team-social">
                <img src="/logo/Linkedin.png" alt="LinkedIn" width="16" height="16" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>What you&rsquo;ll find here</h2>
        <ul className="feature-list">
          <li><strong>Destination guides</strong> &mdash; best time to visit, how to get there, ideal stay length, and budget ranges</li>
          <li><strong>Stay recommendations</strong> &mdash; lodges and backpackers grouped by budget tier, with direct contact details</li>
          <li><strong>Activity listings</strong> &mdash; hikes, safaris, boat cruises, and cultural experiences with costs and providers</li>
          <li><strong>Real travel times</strong> &mdash; drive times and distances from Kampala, calculated route-by-route</li>
          <li><strong>Reviews</strong> &mdash; share your experience and read what other travellers say</li>
        </ul>
      </section>

      <section className="about-section about-section--approach">
        <h2>Our approach</h2>
        <p>
          Everything on Trip Insights is written from firsthand experience or verified local knowledge.
        </p>
      </section>

      <section className="about-section contact-card">
        <h2>Contact</h2>
        <p>
          Questions, corrections, or trip planning help? Reach us at <a href="mailto:content@trip-insights.com">content@trip-insights.com</a>, or send a WhatsApp to <a href="https://wa.me/256759918649">+256 759 918 649</a>.
        </p>
      </section>

      <p className="meta back-link" style={{ marginTop: 32 }}><a href="/">&larr; Back to homepage</a></p>

      {modalOpen && selectedImage && (
        <div className="image-modal-overlay" onClick={() => { setModalOpen(false); setSelectedImage(null); }} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 3000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <button onClick={() => { setModalOpen(false); setSelectedImage(null); }} style={{
            position: "absolute", top: 16, right: 16, background: "none", border: "none",
            color: "white", fontSize: "2rem", cursor: "pointer", lineHeight: 1,
          }} aria-label="Close">×</button>
          <img src={selectedImage} alt="Team member" style={{
            maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }} />
        </div>
      )}
    </main>
  );
}
