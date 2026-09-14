import { SITE_URL } from "@/lib/site";

/**
 * robots.txt as plain text (Host is Yandex-oriented; Google ignores unknown lines).
 * Content-Signal omitted: Yandex Webmaster flags it as an unknown directive.
 */
export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
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
