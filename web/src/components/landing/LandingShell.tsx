import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-[4.5rem]">{children}</main>
      <Footer />
    </>
  );
}
