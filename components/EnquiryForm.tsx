"use client";
import { useActionState } from "react";
import { submitEnquiry, type FormState } from "@/app/actions";

const INTERESTS = ["wildlife", "adventure", "culture", "relaxing", "birds", "food"];

export default function EnquiryForm({ placeId, title, page }: { placeId: string; title: string; page: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null);
  if (state?.ok) return <div className="form"><h2>Enquiry sent</h2><p>{state.msg}</p></div>;
  return (
    <form className="form" action={action}>
      <h2>Plan a trip to {title}</h2>
      <input type="hidden" name="placeId" value={placeId} />
      <input type="hidden" name="page" value={page} />
      <label htmlFor="name">Your name</label>
      <input id="name" name="name" required maxLength={120} autoComplete="name" />
      <div className="row">
        <div><label htmlFor="method">How should I reply?</label>
          <select id="method" name="method"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></div>
        <div><label htmlFor="contact">WhatsApp number or email</label>
          <input id="contact" name="contact" required maxLength={160} /></div>
      </div>
      <div className="row">
        <div><label htmlFor="dates">Travel dates (or &quot;not sure yet&quot;)</label><input id="dates" name="dates" maxLength={120} /></div>
        <div><label htmlFor="group">Travellers</label><input id="group" name="group" type="number" min={1} max={100} defaultValue={2} /></div>
      </div>
      <label htmlFor="budget">Budget per person (optional)</label>
      <select id="budget" name="budget"><option value="">Not sure</option><option>Under $100 a day</option><option>$100-250 a day</option><option>Over $250 a day</option></select>
      <label>Interests (optional)</label>
      <div className="interests">{INTERESTS.map(t => <label key={t}><input type="checkbox" name="interests" value={t} /> {t}</label>)}</div>
      <label htmlFor="message">Anything else I should know?</label>
      <textarea id="message" name="message" rows={3} maxLength={2000} />
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="go" disabled={pending}>{pending ? "Sending..." : "Send enquiry"}</button>
      {state && !state.ok && <p className="msg" role="alert">{state.msg}</p>}
    </form>
  );
}
