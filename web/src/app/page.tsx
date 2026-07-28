import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Catalog } from "@/components/sections/Catalog";
import { Sellers } from "@/components/sections/Sellers";
import { Calculator } from "@/components/Calculator";
import { Faq } from "@/components/sections/Faq";
import { Footer } from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Catalog />
        <Sellers />
        <Calculator />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
