// Called by a Supabase Database Webhook (table: enquiries, event: INSERT) with the x-notify-secret header.
export async function POST(req: Request) {
  if (req.headers.get("x-notify-secret") !== process.env.NOTIFY_SECRET) return new Response("Unauthorized", { status: 401 });
  const { record: r } = await req.json();
  const text = [
    `New enquiry from ${r.name}`, `Reply via ${r.contact_method}: ${r.contact}`,
    `Dates: ${r.travel_dates ?? "-"} | Travellers: ${r.group_size ?? "-"} | Budget: ${r.budget ?? "-"}`,
    `Interests: ${(r.interests ?? []).join(", ") || "-"}`, `Page: ${r.source_page ?? "-"}`, "", r.message ?? "",
  ].join("\n");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM, to: [process.env.NOTIFY_TO], subject: `New enquiry: ${r.name}`, text }),
  });
  return new Response(res.ok ? "ok" : "email failed", { status: res.ok ? 200 : 502 });
}
