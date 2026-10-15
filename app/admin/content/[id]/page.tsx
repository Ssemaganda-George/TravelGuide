import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/admin";
import ActivitiesEditor from "@/components/admin/ActivitiesEditor";
import LodgesEditor from "@/components/admin/LodgesEditor";
import { saveContent } from "../../actions";

export const metadata: Metadata = { title: "Edit destination", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const { data: d } = await sb.from("destination_content").select("*").eq("id", (await params).id).maybeSingle();
  if (!d) notFound();
  const [{ data: activities }, { data: stays }] = await Promise.all([
    sb.from("activities").select("id,name,description,cost_low,cost_high,currency,duration,media").eq("place_id", d.place_id).order("name"),
    sb.from("partners").select("id,name,description,tier,contact,media").eq("type", "lodge").contains("place_ids", [d.place_id]),
  ]);
  return (
    <div className="wrap page" style={{ maxWidth: 960 }}>
      <Link className="back" href="/admin/content">Back to content</Link>
      <h1>Edit {d.title}</h1>
      <p className="hook">Everything on the public page comes from this form. Save once when you are done.</p>
      <form className="form" action={saveContent}>
        <input type="hidden" name="id" value={d.id} />

        <section className="fsec">
          <h3>The basics</h3>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={d.title} required />
          <label htmlFor="hook">One-line hook</label>
          <input id="hook" name="hook" defaultValue={d.hook ?? ""} placeholder="Where the Nile begins its journey north, and where Uganda goes to play." />
          <div className="row2">
            <div><label htmlFor="st">Status</label>
              <select id="st" name="status" defaultValue={d.status}><option value="draft">draft</option><option value="published">published</option></select>
            </div>
            <div><label htmlFor="ck">Last checked</label>
              <input id="ck" name="checked" type="date" defaultValue={d.last_checked ?? ""} />
            </div>
          </div>
        </section>

        <section className="fsec">
          <h3>Quick facts</h3>
          <label htmlFor="rg">Region</label>
          <input id="rg" name="region" defaultValue={d.region ?? ""} placeholder="Eastern Uganda, on Lake Victoria and the Nile" />
          <div className="row2">
            <div><label htmlFor="bm">Best months</label><input id="bm" name="best_months" defaultValue={d.best_months ?? ""} placeholder="Dec-Feb, Jun-Aug" /></div>
            <div><label htmlFor="br">Budget range</label><input id="br" name="budget_range" defaultValue={d.budget_range ?? ""} placeholder="Backpacker to luxury" /></div>
            <div><label htmlFor="dy">Ideal stay (days)</label><input id="dy" name="days" type="number" min="1" defaultValue={d.ideal_days ?? ""} /></div>
            <div><label htmlFor="tg">Tags (comma separated)</label><input id="tg" name="tags" defaultValue={(d.tags ?? []).join(", ")} placeholder="adventure, relaxing, birds" /></div>
          </div>
        </section>

        <section className="fsec">
          <h3>The story</h3>
          <label htmlFor="story">Story (blank line between paragraphs)</label>
          <textarea id="story" name="story" rows={12} defaultValue={d.story ?? ""} placeholder={"Jinja doesn't announce itself...\n\nhttps://example.com/sunrise.jpg\n\nBy evening it slows right down."} />
          <p className="hint">To place a photo inside the story, put its URL on a line of its own, or write <code>![caption](https://...)</code> for a captioned photo.</p>
          <label htmlFor="bt">Best time to visit</label>
          <textarea id="bt" name="best_time" rows={4} defaultValue={d.best_time ?? ""} placeholder="Dry seasons mean easier roads. The river runs year-round, and midweek is quieter than weekends." />
        </section>

        <section className="fsec">
          <h3>Getting there</h3>
          <label htmlFor="gt">How to reach it</label>
          <textarea id="gt" name="getting_there" rows={4} defaultValue={d.getting_there ?? ""} placeholder="By road from Kampala via the Jinja highway. Avoid leaving during rush hours." />
        </section>

        <section className="fsec">
          <h3>Things to do</h3>
          <p className="hint">Add each activity with a short description and rough cost. Photos and videos show in a gallery on the public page.</p>
          <ActivitiesEditor initial={activities ?? []} />
        </section>

        <section className="fsec">
          <h3>Where to stay</h3>
          <p className="hint">One line per lodge keeps the public page clean. Tier controls the budget / mid-range / comfortable grouping.</p>
          <LodgesEditor initial={stays ?? []} />
        </section>

        <section className="fsec">
          <h3>Local tip</h3>
          <label htmlFor="lt">The tip</label>
          <textarea id="lt" name="local_tip" rows={3} defaultValue={d.local_tip ?? ""} placeholder="Book rafting for the morning, when the water is calmer and the light is best for photos." />
          <label htmlFor="ta">Tip from</label>
          <input id="ta" name="tip_author" defaultValue={d.tip_author ?? ""} placeholder="George" />
        </section>

        <section className="fsec">
          <h3>Plan around it</h3>
          <label htmlFor="pa">What to pair it with</label>
          <textarea id="pa" name="plan_around" rows={3} defaultValue={d.plan_around ?? ""} placeholder="Pair Jinja with Sipi Falls, Mabira Forest, or a night in Kampala before your flight." />
        </section>

        <button className="go">Save changes</button>
      </form>
    </div>
  );
}
