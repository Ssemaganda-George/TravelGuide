const BAD_COUNTRY = new Set(["XX", "T1", "A1", "A2", "O1", "ZZ"]);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Human-readable name for any ISO 3166-1 alpha-2 or alpha-3 code. */
export function countryDisplayName(code: string | null | undefined): string {
  const c = (code ?? "").trim().toUpperCase();
  if (!c || BAD_COUNTRY.has(c)) return "Unknown";
  try {
    return regionNames.of(c) ?? c;
  } catch {
    return c;
  }
}

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  if (BAD_COUNTRY.has(code)) return null;
  return code;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true;
  const v = ip.replace(/^::ffff:/i, "").toLowerCase();
  if (v === "::1" || v === "127.0.0.1" || v === "0.0.0.0" || v === "localhost") return true;
  if (v.startsWith("10.")) return true;
  if (v.startsWith("192.168.")) return true;
  if (v.startsWith("169.254.")) return true;
  const m = v.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

/** Country from CDN / edge headers (Vercel, Cloudflare, CloudFront, Fastly, App Engine). */
export function countryFromHeaders(req: Headers): string | null {
  const raw =
    req.get("x-vercel-ip-country") ??
    req.get("cf-ipcountry") ??
    req.get("cloudfront-viewer-country") ??
    req.get("x-country-code") ??
    req.get("x-appengine-country") ??
    req.get("x-fastly-country-code") ??
    "";
  return normalizeCountryCode(raw);
}

/** Fallback IP → country lookup when edge headers are missing (public IPs only). */
export async function countryFromIp(ip: string): Promise<string | null> {
  if (isPrivateOrLocalIp(ip)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country?: string };
    return normalizeCountryCode(data.country);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve visitor country: edge headers first, then IP lookup. Never returns Unknown placeholders. */
export async function resolveVisitorCountry(req: Request, ip: string): Promise<string | null> {
  const fromHeader = countryFromHeaders(req.headers);
  if (fromHeader) return fromHeader;
  return countryFromIp(ip);
}
