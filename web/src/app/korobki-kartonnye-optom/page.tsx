import type { Metadata } from "next";
import { LandingContent } from "@/components/landing/LandingContent";
import { getLanding } from "@/lib/landings";

const page = getLanding("korobki-kartonnye-optom");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: page.path },
  openGraph: {
    title: page.title,
    description: page.description,
    url: page.path,
  },
};

export default function Page() {
  return <LandingContent slug="korobki-kartonnye-optom" />;
}
