import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationFormModal from "@/components/ApplicationFormModal";

const CareersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Careers | JustOne";
    window.scrollTo(0, 0);
  }, []);

  const responsibilities = [
    "Seed JustOne within campus communities (WhatsApp, Instagram, offline conversations)",
    "Help build trust and awareness without spam",
    "Share feedback from students to improve the product",
    "Work closely with the founding team during a live pilot",
  ];

  const lookingFor = [
    "Currently enrolled university student",
    "Well-connected and trusted on campus",
    "Strong communication skills",
    "Comfortable with responsibility and discretion",
    "Interested in startups, marketing, or community-building",
  ];

  const benefits = [
    "Early-stage startup experience",
    "Direct access to the founding team",
    "Certificate + recommendation",
    "Priority access to future roles",
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="section-container pt-32 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-16"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
          </motion.div>

          {/* Page title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl text-foreground mb-8"
          >
            Careers at JustOne
          </motion.h1>

          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-20"
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              JustOne is a campus-only matchmaking product built around trust, privacy, and intentionality.
              We move slowly, think carefully, and care deeply about how this product shows up on campuses.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.hr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="border-border/50 mb-16"
          />

          {/* Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Open Role
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
              Marketing Intern (Campus Growth)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-12">
              You'll help introduce JustOne to your campus in a thoughtful, human way — through conversations, 
              small groups, and community-led marketing. This is not influencer marketing or mass promotion.
            </p>
          </motion.div>

          {/* Responsibilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-12"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">
              Responsibilities
            </h3>
            <ul className="space-y-3">
              {responsibilities.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Who we're looking for */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">
              Who we're looking for
            </h3>
            <ul className="space-y-3">
              {lookingFor.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* What you'll get */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mb-16"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">
              What you'll get
            </h3>
            <ul className="space-y-3">
              {benefits.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="pt-8 border-t border-border/50"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
            >
              <span className="text-lg">Apply to work with us</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      <ApplicationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};

export default CareersPage;
