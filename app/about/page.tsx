export const revalidate = 3600;

export default function About() {
  return (
    <main className="wrap page about-page">
      <header className="about-header">
        <h1>About Trip Insights</h1>
        <p className="about-sub">Honest Uganda travel guides — real costs, real travel times, local tips from a Kampala-based guide.</p>
      </header>

      <div className="about-bio">
        <p><strong>Written by George.</strong> I&rsquo;m a Kampala-based guide and tech person who takes travellers around the World. These are the tips I give my own clients and I am happy to share with you. Know your next destination before you go.</p>
      </div>

      <section className="about-section">
        <h2>Meet the team</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-image">G</div>
            <div className="team-name">George</div>
            <div className="team-role">Founder &amp; Lead Guide</div>
            <p className="team-bio">Kampala-based guide and tech person who takes travellers around Uganda and beyond. Real costs, real travel times, local knowledge you won&rsquo;t find in glossy brochures.</p>
            <p className="team-contact"><a href="mailto:content@trip-insights.com">content@trip-insights.com</a> &bull; <a href="https://wa.me/256759918649">+256 759 918 649</a></p>
          </div>
          <div className="team-card">
            <div className="team-image">W</div>
            <div className="team-name">Winnie</div>
            <div className="team-role">Chief Editor — Destination Content</div>
            <p className="team-bio">Winnie oversees all destination content on Trip Insights, ensuring every guide, review, and recommendation is accurate, up to date, and written from firsthand experience.</p>
          </div>
        </div>
      </section>

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
    </main>
  );
}
