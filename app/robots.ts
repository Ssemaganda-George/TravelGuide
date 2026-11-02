import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
