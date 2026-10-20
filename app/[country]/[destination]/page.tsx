import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";
import MediaGallery from "@/components/MediaGallery";
import Story from "@/components/Story";
import { SITE, getCountry, getDestinations, getActivities, getStays } from "@/lib/data";
import { safeSrc } from "@/lib/media";
import { STAY_TIERS } from "@/lib/tiers";

export const revalidate = 3600;

type P = { params: Promise<{ country: string; destination: string }> };

async function load({ params }: P) {
  const { country, destination } = await params;
  const c = await getCountry(country);
  if (!c) return null;
  const d = (await getDestinations(c.id)).find(x => x.places.slug === destination);
  if (!d) return null;
  const [activities, stays] = await Promise.all([getActivities(d.place_id), getStays(d.place_id)]);
  return { c, d, activities, stays };
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const r = await load(p);
  if (!r) return {};
  const { c, d } = r;
  return {
    title: `${d.title}, ${c.name}: travel guide`,
    description: d.hook ?? undefined,
    alternates: { canonical: `/${c.slug}/${d.places.slug}` },
    openGraph: { title: `${d.title}, ${c.name}`, description: d.hook ?? undefined, type: "article" },
  };
}

const money = (lo: number | null, hi: number | null) => {
  if (lo == null && hi == null) return null;
  if (lo != null && hi != null) return `$${lo}-${hi}`;
  return `from $${lo ?? hi}`;
};

export default async function Destination(p: P) {
  const r = await load(p);
  if (!r) notFound();
  const { c, d, activities, stays } = r;
  const path = `/${c.slug}/${d.places.slug}`;
  const facts = [
    ["Region", d.region], ["Best time", d.best_months], ["Budget", d.budget_range],
    ["Ideal stay", d.ideal_days && `${d.ideal_days} days`], ["Last checked", d.last_checked],
  ].filter(f => f[1]);
  const jsonLd = { "@context": "https://schema.org", "@type": "TouristDestination", name: d.title, description: d.hook, url: SITE + path, touristType: d.tags };
  const paras = (s: string | null) => (s ?? "").split(/\n\n+/).map(x => x.trim()).filter(Boolean);
  const otherStays = stays.filter(s => !s.tier || !STAY_TIERS.some(([k]) => k === s.tier));
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link className="back" href={`/${c.slug}`}>Back to destinations</Link>
      <h1>{d.title}</h1>
      <p className="hook">{d.hook}</p>
      <dl className="facts">{facts.map(f => <div key={String(f[0])}><dt>{f[0]}</dt><dd>{f[1]}</dd></div>)}</dl>
      <Story text={d.story} />

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
                <MediaGallery items={a.media} />
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Where to stay</h2>
      <p className="hook">Places to rest after your day out, grouped by budget tier.</p>
      {stays.length > 0 ? (
        <>
          {STAY_TIERS.map(([tier, label]) => {
            const list = stays.filter(s => s.tier === tier);
            if (!list.length) return null;
            return (
              <div key={tier}>
                <h3>{label}</h3>
                <div className="cards">
                  {list.map(s => (
                    <div className="cell" key={s.id}>
                      {s.media?.[0]?.url && (
                        <figure className="cellimg">
                          <img src={safeSrc(s.media[0].url) ?? ""} alt="" loading="lazy" />
                        </figure>
                      )}
                      <div className="cellbody">
                        <h4>{s.name}</h4>
                        {s.description && <p>{s.description}</p>}
                        {s.contact && <p className="meta">{s.contact}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {otherStays.length > 0 && (
            <div className="cards">
              {otherStays.map(s => (
                <div className="cell" key={s.id}>
                  {s.media?.[0]?.url && (
                    <figure className="cellimg">
                      <img src={safeSrc(s.media[0].url) ?? ""} alt="" loading="lazy" />
                    </figure>
                  )}
                  <div className="cellbody">
                    <h4>{s.name}</h4>
                    {s.description && <p>{s.description}</p>}
                    {s.contact && <p className="meta">{s.contact}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="empty">No places to stay listed yet. Check back soon.</p>
      )}

      <div className="tip">
        <Link href={`/${c.slug}/${d.places.slug}/reviews`} style={{ color: "var(--lake)", textDecoration: "underline" }}>
          ➔ Read &amp; write reviews for {d.title}
        </Link>
      </div>

      {d.local_tip && <div className="tip"><strong>Local tip{d.tip_author ? ` from ${d.tip_author}` : ""}</strong><br />{d.local_tip}</div>}

      {paras(d.plan_around).length > 0 && <><h2>Plan around it</h2>{paras(d.plan_around).map((t, i) => <p key={i}>{t}</p>)}</>}

      <EnquiryForm placeId={d.place_id} title={d.title} page={path} />
    </div>
  );
}
