import type { Metadata } from "next";
import { authClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

export const metadata: Metadata = { title: "Enquiries", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "quoted", "booked", "lost"] as const;

async function updateStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  const lost_reason = String(fd.get("lost_reason")) || null;
  const { error } = await sb.from("enquiries").update({ status, lost_reason }).eq("id", id);
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  redirect("/admin?success=" + encodeURIComponent("Status updated successfully"));
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "new") return "destructive";
  if (status === "booked") return "default";
  if (status === "lost") return "outline";
  return "secondary";
}

export default async function Admin() {
  const sb = await authClient();
  const { data: admin } = await sb.from("admins").select("user_id").maybeSingle();
  if (!admin) redirect("/admin/login");
  const { data } = await sb
    .from("enquiries")
    .select("*, places(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const waiting = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="text-muted-foreground text-sm">
          {waiting ? `${waiting} waiting for a first reply` : "No new enquiries."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((r) => {
          const link =
            r.contact_method === "whatsapp"
              ? `https://wa.me/${String(r.contact).replace(/\D/g, "")}`
              : `mailto:${r.contact}`;
          const details = [
            r.travel_dates,
            r.group_size && `${r.group_size} travellers`,
            r.budget,
            (r.interests ?? []).join(", "),
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Card key={r.id} className="min-w-0">
              <CardHeader>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <CardTitle className="break-words text-lg">{r.name}</CardTitle>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <Badge variant="outline">{r.places?.name ?? "General"}</Badge>
                </div>
                <CardDescription className="break-words">
                  {new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Kampala" })} · from{" "}
                  {r.source_channel || "direct"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 space-y-2 text-sm">
                <p className="break-all">
                  <a className="text-primary underline-offset-4 hover:underline" href={link}>
                    {r.contact}
                  </a>{" "}
                  <span className="text-muted-foreground">({r.contact_method})</span>
                </p>
                {details && <p className="break-words">{details}</p>}
                {r.message && <p className="text-muted-foreground whitespace-pre-wrap break-words">{r.message}</p>}
              </CardContent>
              <CardFooter>
                <form action={updateStatus} className="flex min-w-0 w-full flex-col gap-3 lg:flex-row lg:items-end">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Label htmlFor={`status-${r.id}`}>Status</Label>
                    <select
                      id={`status-${r.id}`}
                      name="status"
                      defaultValue={r.status}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      aria-label="Status"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Label htmlFor={`lost-${r.id}`}>If lost: why?</Label>
                    <Input
                      id={`lost-${r.id}`}
                      name="lost_reason"
                      placeholder="Reason"
                      defaultValue={r.lost_reason ?? ""}
                    />
                  </div>
                  <Button type="submit">Save status</Button>
                </form>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
