import { SITE_URL } from "@/lib/site";

/**
 * robots.txt with Content Signals (contentsignals.org).
 * MetadataRoute.Robots cannot emit Content-Signal, so we serve plain text.
 *
 * search/ai-input = yes → visibility in AI search / answers
 * ai-train = no → no preference for model training use
 */
export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
