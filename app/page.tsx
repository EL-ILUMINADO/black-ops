import Footer from "@/components/footer";
import Hero from "@/components/hero";
import ThreatMatrix from "@/components/threatMatrix";

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Hero />
      <ThreatMatrix />
      <Footer />
    </div>
  );
}