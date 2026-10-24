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
import { LikeButton } from "@/components/LikeButton";
import { SITE, SITE_NAME } from "@/lib/site";
import { getCountry, getDestinations, getActivities, getStays, getEngagementForPlaces, getRelatedDestinations } from "@/lib/data";
import { STAY_TIERS } from "@/lib/tiers";
import { safeSrc } from "@/lib/media";
import { PartnerCard } from "@/components/PartnerCard";

export const revalidate = 3600;

type P = { params: Promise<{ country: string; destination: string }> };

async function load({ params }: P) {
  const { country, destination } = await params;
  const c = await getCountry(country);
  if (!c) return null;
  const d = (await getDestinations(c.id)).find(x => x.places.slug === destination);
  if (!d) return null;
  const [activities, stays, engagement, related] = await Promise.all([
    getActivities(d.place_id),
    getStays(d.place_id),
    getEngagementForPlaces([d.place_id]),
    getRelatedDestinations(d.place_id, d.tags ?? [], 4),
  ]);
  // Find cover image from first activity's media
  const coverImage = activities[0]?.media?.[0]?.url ?? null;
  return { c, d, activities, stays, engagement: engagement[d.place_id] ?? { likes: 0, reviews: 0, avgRating: 0 }, coverImage, related };
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const r = await load(p);
  if (!r) return {};
  const { c, d, coverImage } = r;
  const path = `/${c.slug}/${d.places.slug}`;
  const absoluteUrl = `${SITE}${path}`;
  const ogImage = coverImage ? `${SITE}${coverImage}` : `${SITE}/og-default`;

  return {
    title: d.meta_title ?? `${d.title}, ${c.name}: travel guide, costs and local tips | ${SITE_NAME}`,
    description: d.meta_description ?? d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips from a guide who takes people there.`,
    alternates: { canonical: `${SITE}/${c.slug}/${d.places.slug}` },
    openGraph: {
      title: d.meta_title ?? `${d.title}, ${c.name}: travel guide, costs and local tips | ${SITE_NAME}`,
      description: d.meta_description ?? d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips.`,
      type: "article",
      siteName: "Trip Insights",
      url: absoluteUrl,
      images: coverImage ? [{ url: `${SITE}${coverImage}`, alt: d.title, width: 1200, height: 630 }] : [{ url: `${SITE}/og-default`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta_title ?? `${d.title}, ${c.name}: travel guide, costs and local tips | ${SITE_NAME}`,
      description: d.meta_description ?? d.hook ?? `Discover ${d.title} in ${c.name}. Travel guide with real costs, best times, and local tips.`,
      images: coverImage ? [`${SITE}${coverImage}`] : [`${SITE}/og-default`],
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
      bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    } as Record<string, string>,
    robots: { index: true, follow: true },
  };
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
      mainEntity: {
        "@type": "TouristDestination",
        name: d.title,
        description: d.hook,
      },
    },
  ];

  // Add FAQ schema if FAQs exist
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

  // Add review/rating schema if there are real reviews
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
  const { c, d, activities, stays, engagement, coverImage, related } = r;
  const path = `/${c.slug}/${d.places.slug}`;
  const absoluteUrl = `${SITE}${path}`;
  const facts = [
    ["Region", d.region], ["Best time", d.best_months], ["Budget", d.budget_range],
    ["Ideal stay", d.ideal_days && `${d.ideal_days} days`], ["Travel time", d.travel_time], ["Last checked", d.last_checked],
  ];
  const paras = (s: string | null) => (s ?? "").split(/\n\n+/).map(x => x.trim()).filter(Boolean);
  
  // Normalize stay tiers: map old "comfort" tier to "luxury"
  const normalizedStays = stays.map(s => ({
    ...s,
    tier: s.tier === "comfort" ? "luxury" : s.tier
  }));
  
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
            <div className="desthead">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h1>{d.title}</h1>
                <p className="hook">{d.hook}</p>
              </div>
              <LikeButton placeId={d.place_id} initialLikes={engagement.likes} initialLiked={false} />
            </div>
          </div>
          <dl className="facts">{facts.map(f => <div key={String(f[0])}><dt>{f[0]}</dt><dd>{f[1]}</dd></div>)}</dl>
          
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

          {paras(d.best_time).length > 0 && <><h2>Best time to visit</h2>{paras(d.best_time).map((t, i) => <p key={i}>{t}</p>)}</>}

          {paras(d.getting_there).length > 0 && <><h2>Getting there</h2>{paras(d.getting_there).map((t, i) => <p key={i}>{t}</p>)}</>}

          {activities.length > 0 && (
            <>
              <h2>Things to do</h2>
              <div className="cards">
                {activities.map(a => (
                  <div className="cell" key={a.id}>
                    <h3>{a.name}</h3>
                    <p className="meta">{[money(a.cost_low, a.cost_high), a.duration].filter(Boolean).join(" · ")}</p>
                    {a.description && <p>{a.description}</p>}
                    {a.providers?.length && (
                      <div className="meta" style={{ fontSize: "0.85rem", marginTop: 6 }}>
                        Providers: {a.providers.map(p => p.name).join(", ")}
                      </div>
                    )}
                    <MediaGallery items={a.media} />
                  </div>
                ))}
              </div>
            </>
          )}

          <h2>Where to stay</h2>
          <p className="hook">Places to rest after your day out, grouped by budget tier.</p>
          {normalizedStays.length > 0 ? (
            <>
              {STAY_TIERS.map(([tier, label]) => {
                const list = normalizedStays.filter(s => s.tier === tier);
                if (!list.length) return null;
                return (
                  <div key={tier}>
                    <h3>{label}</h3>
                    <div className="cards">
                      {list.map(s => (
                        <PartnerCard key={s.id} partner={s} country={c.name} category="stay" />
                      ))}
                    </div>
                  </div>
                );
              })}
              {otherStays.length > 0 && (
                <div className="cards">
                  {otherStays.map(s => (
                    <PartnerCard key={s.id} partner={s} country={c.name} category="stay" />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="empty">No places to stay listed yet. Check back soon.</p>
          )}

          {/* FAQ Section */}
          {d.faq && d.faq.length > 0 && (
            <section aria-labelledby="faq-heading" style={{ marginTop: 40 }}>
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

{paras(d.plan_around).length > 0 && <><h2>Plan around it</h2>{paras(d.plan_around).map((t, i) => <p key={i}>{t}</p>)}</>}

            <EnquiryTrigger placeId={d.place_id} title={d.title} page={`/${c.slug}/${d.places.slug}`} />

            {/* Related destinations */}
            {related.length > 0 && (
              <section aria-labelledby="related-heading" style={{ marginTop: 40 }}>
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