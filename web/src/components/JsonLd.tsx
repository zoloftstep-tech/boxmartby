import {
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/site";

export function JsonLd() {
  const graphs = [
    buildWebSiteJsonLd(),
    buildOrganizationJsonLd(),
    buildLocalBusinessJsonLd(),
    buildFaqJsonLd(),
  ];

  return (
    <>
      {graphs.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}
