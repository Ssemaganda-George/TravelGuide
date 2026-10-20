"use client";
import { useEffect, useState, FormEvent } from "react";

const KEY = "travelguide_reviewer";

type Reviewer = { name: string; email: string; country: string } | null;

function loadReviewer(): Reviewer {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
function saveReviewer(r: Reviewer) { localStorage.setItem(KEY, JSON.stringify(r)); }

const stars = (n: number) => {
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
};

type Review = {
  id: string; rating: number; author: string; country?: string | null;
  email?: string | null; comment?: string | null; created_at: string;
};

type User = { email?: string; user_metadata?: { full_name?: string; country?: string } } | null;

export default function ReviewForm({ placeId, title, user }: { placeId: string; title: string; user?: User }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewer, setReviewer] = useState<Reviewer>(loadReviewer());
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rCountry, setRCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Auto-fill reviewer from logged-in user account
  useEffect(() => {
    if (user && !reviewer) {
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "A traveller";
      const r: Reviewer = { name, email: user.email ?? "", country: user.user_metadata?.country ?? "" };
      saveReviewer(r);
      setReviewer(r);
    }
  }, [user, reviewer]);

  useEffect(() => {
    fetch(`/api/reviews?placeId=${encodeURIComponent(placeId)}`)
      .then(async r => {
        const data = await r.json();
        if (r.ok) setReviews(data);
      })
      .catch(() => {});
  }, [placeId]);

  const setStars = (n: number) => setRating(n);

  const saveReviewerDetails = (e: FormEvent) => {
    e.preventDefault();
    if (!rName || !rEmail || !rCountry) return;
    const r: Reviewer = { name: rName, email: rEmail, country: rCountry };
    saveReviewer(r);
    setReviewer(r);
    setRName(""); setREmail(""); setRCountry("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewer) {
      setMessage({ ok: false, text: "Please enter your name, email, and country." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId, rating, author: reviewer.name, email: reviewer.email,
          country: reviewer.country, comment,
        }),
      });
      if (res.ok) {
        setMessage({ ok: true, text: "Thanks! Your review has been submitted for approval." });
        setComment("");
        setRating(5);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        setMessage({ ok: false, text: err.error || "Could not post review." });
      }
    } catch {
      setMessage({ ok: false, text: "Could not post review. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoggedIn = !!user;
  const autoReviewer = isLoggedIn ? ({
    name: (user!.user_metadata?.full_name ?? user!.email?.split("@")[0] ?? "A traveller"),
    email: user!.email ?? "",
    country: (user!.user_metadata?.country ?? ""),
  } as Reviewer) : null;

  return (
    <div className="form">
      {message && (
        <p className={message.ok ? "msg" : "msg err"} role="alert">{message.text}</p>
      )}
      <h2>Share your review of {title}</h2>

      {!reviewer && !autoReviewer && (
        <fieldset className="reviewer-fieldset">
          <legend>Tell us about yourself</legend>
          <form onSubmit={saveReviewerDetails}>
            <label htmlFor="rname">Your name</label>
            <input id="rname" value={rName} onChange={e => setRName(e.target.value)} required maxLength={80} autoComplete="name" />
            <label htmlFor="remail">Email</label>
            <input id="remail" value={rEmail} onChange={e => setREmail(e.target.value)} type="email" required maxLength={160} autoComplete="email" />
            <label htmlFor="rcountry">Country</label>
            <input id="rcountry" value={rCountry} onChange={e => setRCountry(e.target.value)} required maxLength={80} autoComplete="country" />
            <button type="submit" className="go">Save details</button>
          </form>
        </fieldset>
      )}

      {(reviewer || autoReviewer) && (
        <>
          <p className="meta">Posting as {(reviewer || autoReviewer)!.name} · {(reviewer || autoReviewer)!.country}</p>
          {isLoggedIn && <p className="meta" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Signed in as {user!.email}</p>}
          <button type="button" className="chip" onClick={() => { setReviewer(null); localStorage.removeItem(KEY); }} style={{ marginBottom: 12 }}>
            Change details
          </button>
          <form onSubmit={submit}>
            <label>Your rating</label>
            <div className="starrating" role="radiogroup" aria-label="Rating">
              {[5, 4, 3, 2, 1].map(n => (
                <button
                  key={n}
                  type="button"
                  className={n <= rating ? "active" : ""}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  aria-checked={n === rating}
                >
                  ★
                </button>
              ))}
            </div>
            <label htmlFor="rcomment">Your review</label>
            <textarea id="rcomment" name="comment" rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you love? Any tips for other travellers?" />
            <button className="go" type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Post review"}
            </button>
          </form>
        </>
      )}

      <h3 style={{ marginTop: 30 }}>What other travellers say ({reviews.length})</h3>
      {reviews.length === 0 && <p className="empty">No reviews yet. Be the first!</p>}
      {reviews.map(r => (
        <div className="item" key={r.id}>
          <div className="ihead">
            <strong>{r.author}</strong>
            {r.country && <span className="meta">· {r.country}</span>}
          </div>
          <div className="meta" style={{ fontSize: "0.85rem" }}>{new Date(r.created_at).toLocaleDateString()}</div>
          <div className="stars" style={{ margin: "4px 0" }}>{stars(r.rating)}</div>
          {r.comment && <p>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
