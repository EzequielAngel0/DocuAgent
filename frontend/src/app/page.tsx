import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import TechStack from "@/components/landing/TechStack";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="layout-wrapper">
      <Navbar />
      <main style={{ flex: "1 0 auto" }}>
        <Hero />
        <Features />
        <HowItWorks />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
}
