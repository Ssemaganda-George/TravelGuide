import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import EnquirySection from "@/components/EnquirySection";
import EnquiryTrigger from "@/components/EnquiryTrigger";
import MediaGallery from "@/components/MediaGallery";
import StayImages from "@/components/StayImages";
import Story from "@/components/Story";
import { ViewTracker } from "@/components/ViewTracker";
import HeaderStats from "@/components/HeaderStats";
import { SITE, SITE_NAME } from "@/lib/site";
import { getCountry, getCountries, getDestinations, getActivities, getStays, getEngagementForPlaces, getRelatedDestinations, getViewCounts } from "@/lib/data";
import { COUNTRY_REFERENCE_POINTS } from "@/lib/data";
import { STAY_TIERS } from "@/lib/tiers";
import { safeSrc } from "@/lib/media";
import { PartnerCard } from "@/components/PartnerCard";
import DestinationMap from "@/components/DestinationMap";
import FullMapModalWrapper from "@/components/FullMapModal";

export const revalidate = 3600;

type P = { params: Promise<{ country: string; destination: string }> };

function getTravelTimeMultiplier(tags: string[], country: string): number {
  const allTags = tags.map(t => t.toLowerCase()).join(' ');
  let multiplier = 1.0;

  // Terrain multipliers
  if (allTags.includes('mountain') || allTags.includes('rwandori') || allTags.includes('elgon') ||
      allTags.includes('volcano') || allTags.includes('hiking') || allTags.includes('trekking')) {
    multiplier = 1.5;
  } else if (allTags.includes('park') || allTags.includes('wildlife') || allTags.includes('reserve') ||
             allTags.includes('forest') || allTags.includes('gorilla') || allTags.includes('chimpanzee')) {
    multiplier = 1.3;
  } else if (allTags.includes('remote') || allTags.includes('kidepo') || allTags.includes('far')) {
    multiplier = 1.25;
  }

  // Busy capital areas: add extra time for traffic/congestion
  // Destinations close to capital have more traffic
  if (country === 'uganda') {
    multiplier *= 1.15; // Kampala traffic factor
  }

  return multiplier;
}

async function load({ params }: P) {
  const { country, destination } = await params;
  const c = await getCountry(country);
  if (!c) return null;
  const d = (await getDestinations(c.id)).find(x => x.places.slug === destination);
  if (!d) return null;
  const path = `/${c.slug}/${d.places.slug}`;
  const [activities, stays, engagement, related, viewCounts] = await Promise.all([
    getActivities(d.place_id),
    getStays(d.place_id),
    getEngagementForPlaces([d.place_id]),
    getRelatedDestinations(d.place_id, d.tags ?? [], 4),
    getViewCounts([path]),
  ]);

  // Compute travel time + distance from capital via OSRM if not stored
  let duration_min = d.duration_min;
  let distance_km = d.distance_km;
  if ((!duration_min || !distance_km) && d.latitude != null && d.longitude != null) {
    const ref = COUNTRY_REFERENCE_POINTS[country];
    if (ref) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${ref.position[1]},${ref.position[0]};${d.longitude},${d.latitude}?overview=false&annotations=duration,distance&approaches=curb;curb&alternatives=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const route = data.routes[0];
          distance_km = Math.round(route.distance / 1000 * 10) / 10;
          // Base: 1 minute per 1 km, then apply terrain/busy multipliers
          const baseMinutes = Math.round(distance_km);
          const multiplier = getTravelTimeMultiplier(d.tags ?? [], country);
          duration_min = Math.round(baseMinutes * multiplier);
        }
      } catch {
        // leave null
      }
    }
  }

  const coverImage = d.media?.[0]?.url ?? activities[0]?.media?.[0]?.url ?? null;
  return { c, d, activities, stays, engagement: engagement[d.place_id] ?? { likes: 0, reviews: 0, avgRating: 0 }, coverImage, related, viewCounts, duration_min, distance_km };
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const r = await load(p);
  if (!r) return {};
  const { c, d, coverImage } = r;
  const path = `/${c.slug}/${d.places.slug}`;
  const absoluteUrl = `${SITE}${path}`;
  const ogImage = coverImage ? `${SITE}${coverImage}` : `${SITE}/og-default`;

  return {
    title: d.meta_title ?? `${d.title}, ${c.name}: travel guide | ${SITE_NAME}`,
    description: d.meta_description ?? (d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips from a guide who takes people there.`).slice(0, 160),
    alternates: { canonical: `${SITE}/${c.slug}/${d.places.slug}` },
    openGraph: {
      title: d.meta_title ?? `${d.title}, ${c.name}: travel guide | ${SITE_NAME}`,
      description: d.meta_description ?? (d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips from a guide who takes people there.`).slice(0, 160),
      type: "article",
      siteName: "Trip Insights",
      locale: "en_GB",
      url: absoluteUrl,
      images: coverImage ? [{ url: `${SITE}${coverImage}`, alt: d.title, width: 1200, height: 630 }] : [{ url: `${SITE}/og-default`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta_title ?? `${d.title}, ${c.name}: travel guide, costs and local tips | ${SITE_NAME}`,
      description: d.meta_description ?? (d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips from a guide who takes people there.`).slice(0, 160),
      images: coverImage ? [`${SITE}${coverImage}`] : [`${SITE}/og-default`],
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
      bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    } as Record<string, string>,
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const countries = await getCountries();
  const params: Array<{ country: string; destination: string }> = [];
  for (const c of countries) {
    const destinations = await getDestinations(c.id, c.slug);
    for (const d of destinations) {
      params.push({ country: c.slug, destination: d.places.slug });
    }
  }
  return params;
}

const money = (lo: number | null, hi: number | null) => {
  if (lo == null && hi == null) return null;
  if (lo != null && hi != null) return `$${lo}-${hi}`;
  return `from $${lo ?? hi}`;
};

function generateJsonLd(d: any, c: any, activities: any[], stays: any[], path: string, absoluteUrl: string, engagement: any, coverImage?: string | null) {
  const jsonLd: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Trip Insights",
      url: SITE,
      logo: `${SITE}/favicon.svg`,
      sameAs: [
        "https://instagram.com/tripinsights",
        "https://tiktok.com/@tripinsights",
        "https://wa.me/256759918649"
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Trip Insights",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: d.title,
      description: d.hook,
      url: `${SITE}/${d.places.slug}`,
      image: coverImage ? `${SITE}${coverImage}` : `${SITE}/og-default`,
      touristType: d.tags ?? [],
      address: {
        "@type": "PostalAddress",
        addressCountry: d.region ? `${d.region}, Uganda` : "Uganda",
      },
      geo: d.latitude && d.longitude ? {
        "@type": "GeoCoordinates",
        latitude: d.latitude,
        longitude: d.longitude,
      } : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: d.places.name, item: `${SITE}/${d.places.slug}` },
        { "@type": "ListItem", position: 3, name: d.title, item: `${SITE}/${d.places.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: d.title,
      description: d.hook,
      url: `${SITE}/${d.places.slug}`,
      isPartOf: { "@id": SITE },
      author: {
        "@type": "Person",
        name: "George",
        url: `${SITE}/about`,
        sameAs: [
          "https://instagram.com/tripinsights",
          "https://tiktok.com/@tripinsights",
        ],
      },
      datePublished: d.updated_at ?? undefined,
      dateModified: d.updated_at ?? undefined,
      about: d.title,
    },
  ];

  if (d.faq && d.faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f: { q: string; a: string }) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }

  if (engagement.reviews > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "AggregateRating",
      itemReviewed: {
        "@type": "TouristDestination",
        name: d.title,
      },
      ratingValue: engagement.avgRating,
      reviewCount: engagement.reviews,
      bestRating: "5",
      worstRating: "1",
    });
  }

  return jsonLd;
}

export default async function Destination(p: P) {
  const r = await load(p);
  if (!r) notFound();
  const { c, d, activities, stays, engagement, coverImage, related, viewCounts, duration_min, distance_km } = r;
  const path = `/${c.slug}/${d.places.slug}`;
  const absoluteUrl = `${SITE}${path}`;
  const facts = [
    ["Region", d.region], ["Best time", d.best_months], ["Budget", d.budget_range],
    ["Ideal stay", d.ideal_days && `${d.ideal_days} days`], ["Duration from capital", duration_min ? (() => { const h = Math.floor(duration_min / 60); const m = duration_min % 60; return h === 0 ? `${m} min` : m === 0 ? `${h} hr` : `${h} hr ${m} min`; })() : d.travel_time], ["Distance from capital", distance_km ? `${distance_km} km` : null], ["Last checked", d.last_checked],
  ];

  const normalizedStays = stays.map(s => ({
    ...s,
    tier: s.tier === "comfort" ? "luxury" : s.tier
  }));

  const stayMarkers = normalizedStays
    .filter(s => s.latitude != null && s.longitude != null)
    .map(s => ({
      id: `stay-${s.id}`,
      position: [s.latitude!, s.longitude!] as [number, number],
      name: s.name,
      description: s.description ?? null,
      contact: s.contact ?? null,
      email: s.email ?? null,
      website: s.website ?? null,
      thumbnail: s.media?.[0]?.url ? safeSrc(s.media[0].url!) : undefined,
      media: s.media?.map(m => m.url).filter(Boolean) ?? [],
      travelTime: undefined,
      category: "stay" as const,
      tier: s.tier,
      link: `/${c.slug}/${d.places.slug}#stay-${s.id}`,
      type: "Stay",
    }));

  const activityMarkers = activities
    .filter(a => a.latitude != null && a.longitude != null)
    .map(a => ({
      id: `activity-${a.id}`,
      position: [a.latitude!, a.longitude!] as [number, number],
      name: a.name,
      thumbnail: a.media?.[0]?.url ? safeSrc(a.media[0].url!) : undefined,
      media: a.media?.map(m => m.url).filter(Boolean) ?? [],
      travelTime: undefined,
      category: "activity" as const,
      type: "Activity",
      link: `/${c.slug}/${d.places.slug}#activity-${a.id}`,
    }));

  const destinationMarker = (d.latitude != null && d.longitude != null) ? [{
    id: `destination-${d.place_id}`,
    position: [d.latitude!, d.longitude!] as [number, number],
    name: d.title,
    thumbnail: coverImage ? safeSrc(coverImage) : undefined,
    media: d.media?.map(m => m.url).filter(Boolean) ?? [],
    travelTime: undefined,
    category: "destination" as const,
    hook: d.hook,
    best_months: d.best_months,
    ideal_days: d.ideal_days,
    place_id: d.place_id,
    link: `/${c.slug}/${d.places.slug}`,
  }] : [];

  const localMarkers = [...stayMarkers, ...activityMarkers];

  const allLocalMarkers = [...destinationMarker, ...localMarkers];

  const mapCenter = (d.latitude != null && d.longitude != null)
    ? [d.latitude, d.longitude] as [number, number]
    : [1.3733, 32.2903] as [number, number];

  const paras = (s: string | null) => (s ?? "").split(/\n\n+/).map(x => x.trim()).filter(Boolean);

  const otherStays = normalizedStays.filter(s => !s.tier || !STAY_TIERS.some(([k]) => k === s.tier));
  const jsonLd = generateJsonLd(d, c, activities, stays, path, `${SITE}${path}`, engagement, coverImage);
  const hasMultipleH2 = (d.story?.match(/^## /gm) || []).length >= 3;

  return (
    <div className="destpage">
      <ViewTracker path={`/${c.slug}/${d.places.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="destwrap">
        <main className="destmain">
          <Link className="back" href={`/${c.slug}`}>Back to destinations</Link>
          <header className="desthead">
            <div className="desthead-inner">
              <div>
                <h1>{d.title}</h1>
                <p className="hook">{d.hook}</p>
                <HeaderStats
                  views={viewCounts[path] ?? 0}
                  placeId={d.place_id}
                  path={path}
                  engagement={engagement}
                  staysCount={normalizedStays.length}
                  activitiesCount={activities.length}
                />
              </div>
            </div>
          </header>

          {/* Top bar: Quick Facts + Map button */}
          <div className="dest-topbar">
            <section className="sidebar-card quick-facts-card topbar-card--wide">
              <h2>Quick Facts</h2>
              <dl className="facts">
                {facts.filter(f => f[1]).map(f => (
                  <div key={String(f[0])}><dt>{f[0]}</dt><dd>{f[1]}</dd></div>
                ))}
              </dl>
            </section>

            {((normalizedStays.length > 0) || (activities.length > 0)) && (
              <section className="sidebar-card map-card topbar-card--narrow">
                <div className="sidebar-card-header">
                  <h3>📍 Stays & Activities</h3>
                  <p className="sidebar-card-subtitle">{normalizedStays.length} stays · {activities.length} activities</p>
                </div>
                <FullMapModalWrapper
                  title={d.title}
                  center={mapCenter}
                  markers={allLocalMarkers}
                  country={c.slug}
                  buttonLabel="View full map"
                />
              </section>
            )}
          </div>

          <div className="destgrid">
            <aside className="destsidebar" style={{display: 'none'}}>
              {activities.some(a => a.providers?.length) && (
                <section className="sidebar-card">
                  <h3>Activity Providers</h3>
                  <div className="providers-list">
                    {activities
                      .filter(a => a.providers?.length)
                      .map(a => (
                        <div key={a.id} className="provider-item">
                          <div className="provider-name">{a.name}</div>
                          <div className="provider-names">
                            {a.providers.map(p => p.name).join(", ")}
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </aside>

            <div className="destcontent" style={{gridColumn: '1 / -1'}}>
              {d.story && (
                <>
                  <h2>The story</h2>
                  <div className="story"><Story text={d.story} /></div>
                </>
              )}

              {hasMultipleH2 && (
                <nav className="toc" aria-label="On this page">
                  <h3>On this page</h3>
                  <ol>
                    {(d.story?.match(/^## (.+)/gm) || []).map((heading, i) => (
                      <li key={i}><a href={`#${heading.replace(/^##\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{heading.replace(/^##\s*/, '')}</a></li>
                    ))}
                  </ol>
                </nav>
              )}

              {paras(d.best_time).length > 0 && (
                <>
                  <h2>Best time to visit</h2>
                  {paras(d.best_time).map((t, i) => <p key={i}>{t}</p>)}
                </>
              )}

              {paras(d.getting_there).length > 0 && (
                <>
                  <h2>Getting there</h2>
                  {paras(d.getting_there).map((t, i) => <p key={i}>{t}</p>)}
                </>
              )}

              {activities.length > 0 && (
                <>
              <h2 id="things-to-do">Things to do</h2>
              <div className="activities-list">
                    {activities.map(a => (
                      <article className="activity-item" key={a.id}>
                        <div className="activity-header">
                          <h3>{a.name}</h3>
                          <p className="meta">{[money(a.cost_low, a.cost_high), a.duration].filter(Boolean).join(" · ")}</p>
                        </div>
                        {a.description && <p className="activity-desc">{a.description}</p>}
                        {a.providers?.length && (
                          <p className="meta activity-providers">
                            Providers: {a.providers.map(p => p.name).join(", ")}
                          </p>
                        )}
                        <MediaGallery items={a.media} />
                      </article>
                    ))}
                  </div>
                </>
              )}

              <h2 id="where-to-stay">Where to stay</h2>
              <p className="hook">Places to rest after your day out, grouped by budget tier.</p>
              {normalizedStays.length > 0 ? (
                <>
                  {STAY_TIERS.map(([tier, label]) => {
                    const list = normalizedStays.filter(s => s.tier === tier);
                    if (!list.length) return null;
                    return (
                      <section key={tier} className="stay-tier">
                        <h3>{label}</h3>
                        <div className="stays-grid">
                          {list.map(s => (
                            <PartnerCard key={s.id} partner={s} country={c.name} category="stay" />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  {otherStays.length > 0 && (
                    <section className="stay-tier">
                      <div className="stays-grid">
                        {otherStays.map(s => (
                          <PartnerCard key={s.id} partner={s} country={c.name} category="stay" />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <p className="empty">No places to stay listed yet. Check back soon.</p>
              )}

              {d.faq && d.faq.length > 0 && (
                <section aria-labelledby="faq-heading" className="faq-section">
                  <h2 id="faq-heading">Frequently asked questions</h2>
                  <dl className="faq">
                    {d.faq.map((f: { q: string; a: string }, i: number) => (
                      <div key={i} className="faq-item">
                        <dt><details>
                          <summary>{f.q}</summary>
                          <p>{f.a}</p>
                        </details></dt>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <div className="tip">
                <Link href={`/${c.slug}/${d.places.slug}/reviews`} style={{ color: "var(--lake)", textDecoration: "underline" }}>
                  ➔ Read & write reviews for {d.title}
                </Link>
              </div>

              {d.local_tip && <div className="tip"><strong>Local tip{d.tip_author ? ` from ${d.tip_author}` : ""}</strong><br />{d.local_tip}</div>}

              {paras(d.plan_around).length > 0 && (
                <>
                  <h2>Plan around it</h2>
                  {paras(d.plan_around).map((t, i) => <p key={i}>{t}</p>)}
                </>
              )}

              <EnquiryTrigger placeId={d.place_id} title={d.title} page={`/${c.slug}/${d.places.slug}`} />

              {related.length > 0 && (
                <section aria-labelledby="related-heading" className="related-section">
                  <h2 id="related-heading">More Destinations for you</h2>
                  <div className="cards scrollable">
                    {related.map(r => (
                      <Link key={r.id} href={`/${c.slug}/${r.places.slug}`} className="cell" style={{ textDecoration: "none", color: "inherit", minWidth: "280px", flexShrink: 0 }}>
                        {r.media?.[0]?.url && (
                          <figure className="cellimg">
                            <img src={safeSrc(r.media[0].url) ?? ""} alt={r.title} loading="lazy" />
                          </figure>
                        )}
                        <div className="cellbody">
                          <h4>{r.title}</h4>
                          {r.country && <p className="meta" style={{ fontSize: "0.85rem", marginTop: 4 }}>{r.country}</p>}
                          {r.engagement && r.engagement.reviews > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {stars(r.engagement.avgRating)}
                              <span className="meta" style={{ marginLeft: 6, fontSize: "0.85rem" }}>
                                {r.engagement.avgRating.toFixed(1)} ({r.engagement.reviews} review{r.engagement.reviews !== 1 ? "s" : ""})
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function stars(n: number) {
  const full = Math.floor(n);
  const half = n % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars" aria-label={`${n.toFixed(1)} of 5`}>
      {Array.from({ length: full }).map(() => "★")}
      {half && "☆"}
      {Array.from({ length: empty }).map(() => "☆")}
    </span>
  );
}