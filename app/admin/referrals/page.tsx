import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Referrals", robots: { index: false } };
export const dynamic = "force-dynamic";

async function addReferral(fd: FormData) {
  "use server";
  const sb = await authClient();
  const t = (form: FormData, k: string) => String(form.get(k) ?? "").trim() || null;
  const num = (form: FormData, k: string) => {
    const v = parseFloat(String(form.get(k)));
    return isNaN(v) ? null : v;
  };
  const value = num(fd, "value");
  const { data: p } = await sb
    .from("partners")
    .select("commission_rate,commission_flat,currency")
    .eq("id", String(fd.get("partner")))
    .single();
  const due = p
    ? p.commission_rate != null && value != null
      ? (value * p.commission_rate) / 100
      : p.commission_flat
    : null;
  await sb.from("referrals").insert({
    enquiry_id: String(fd.get("enquiry")),
    partner_id: String(fd.get("partner")),
    booking_value: value,
    currency: p?.currency ?? "USD",
    commission_due: due,
    trip_date: t(fd, "trip"),
  });
  revalidatePath("/admin/referrals");
}

async function setCommissionStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  const status = String(fd.get("status"));
  if (!["pending", "invoiced", "paid"].includes(status)) return;
  await sb
    .from("referrals")
    .update({
      commission_status: status,
      paid_date: status === "paid" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", String(fd.get("id")));
  revalidatePath("/admin/referrals");
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "invoiced") return "secondary";
  if (status === "pending") return "outline";
  return "outline";
}

export default async function Referrals() {
  const sb = await admin();
  if (!sb) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">No access</h1>
        <p className="text-muted-foreground text-sm">Sign in as an admin to manage referrals.</p>
      </div>
    );
  }

  const [{ data: refs }, { data: enqs }, { data: partners }] = await Promise.all([
    sb
      .from("referrals")
      .select("*, enquiries(name), partners(name)")
      .order("trip_date", { ascending: false, nullsFirst: true }),
    sb.from("enquiries").select("id,name,status,places(name)").order("created_at", { ascending: false }).limit(100),
    sb.from("partners").select("id,name").eq("active", true).order("name"),
  ]);

  const rows = refs ?? [];
  const totals: Record<string, number> = {};
  rows.forEach((r) => {
    const k = `${r.commission_status} (${r.currency})`;
    totals[k] = (totals[k] ?? 0) + Number(r.commission_due ?? 0);
  });

  const selectClass =
    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals and commissions</h1>
        <p className="text-muted-foreground text-sm">
          {Object.keys(totals).length
            ? Object.entries(totals)
                .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
                .join(" · ")
            : "No referrals yet."}
        </p>
      </div>

      {Object.keys(totals).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(totals).map(([label, amount]) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-xl tabular-nums">{amount.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Referral list</CardTitle>
          <CardDescription>Track booking value, commission due, and payment status.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing recorded yet. Add a referral below.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Commission due</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.enquiries?.name ?? "—"}</TableCell>
                      <TableCell>{r.partners?.name ?? "—"}</TableCell>
                      <TableCell>
                        {r.booking_value ?? "—"} {r.currency}
                      </TableCell>
                      <TableCell>
                        {r.commission_due != null ? Number(r.commission_due).toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>{r.trip_date ?? "—"}</TableCell>
                      <TableCell>
                        <form action={setCommissionStatus} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <Badge variant={statusVariant(r.commission_status)} className="capitalize">
                            {r.commission_status}
                          </Badge>
                          <select
                            name="status"
                            defaultValue={r.commission_status}
                            aria-label="Commission status"
                            className={`${selectClass} w-auto min-w-[8rem]`}
                          >
                            {["pending", "invoiced", "paid"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle>Record a referral</CardTitle>
          <CardDescription>
            Commission is calculated from the partner rate or flat fee when you save.
          </CardDescription>
        </CardHeader>
        <form action={addReferral} className="flex flex-col">
          <CardContent className="grid gap-x-6 gap-y-6 pb-8 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="re">Enquiry</Label>
              <select id="re" name="enquiry" required className={selectClass}>
                {(enqs ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {(e.places as unknown as { name: string } | null)?.name ?? "General"} ·{" "}
                    {e.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="rp">Partner</Label>
              <select id="rp" name="partner" required className={selectClass}>
                {(partners ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="rv">Booking value</Label>
              <Input id="rv" name="value" type="number" step="0.01" min="0" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="rt">Trip date</Label>
              <Input id="rt" name="trip" type="date" />
            </div>
          </CardContent>
          <CardFooter className="px-6 py-5">
            <Button type="submit">Save referral</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
