import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import PauseMoment from "@/components/PauseMoment";
import Trust from "@/components/Trust";
import Waitlist from "@/components/Waitlist";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <HowItWorks />
      <PauseMoment />
      <Trust />
      <Waitlist />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Index;
