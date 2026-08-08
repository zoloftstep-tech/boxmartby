import {
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/site";

export function JsonLd() {
  const graphs = [buildOrganizationJsonLd(), buildLocalBusinessJsonLd(), buildFaqJsonLd()];

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
