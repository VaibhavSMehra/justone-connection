import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "./Logo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import coupleStargazingImage from "@/assets/couple-stargazing.jpg";

const Footer = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const [campusEmail, setCampusEmail] = useState("");

  const handleCampusWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle campus waitlist submission
    console.log("Campus waitlist:", campusEmail);
    setCampusEmail("");
  };

  return (
    <footer ref={ref} className="relative overflow-hidden">
      {/* Romantic couple image section */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${coupleStargazingImage})` }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-6 py-20 max-w-2xl mx-auto"
        >
          <h2 className="font-display font-light text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            <span className="font-logo text-primary">JustOne</span> not on your campus yet?
          </h2>
          <p className="text-muted-foreground font-medium text-lg mb-2">
            We're coming soon!
          </p>
          <p className="text-muted-foreground font-medium mb-8">
            Universities with the most signups launch first
          </p>

          {/* Campus waitlist form */}
          <form onSubmit={handleCampusWaitlist} className="max-w-sm mx-auto space-y-4">
            <Input
              type="email"
              placeholder="your.name@university.edu"
              value={campusEmail}
              onChange={(e) => setCampusEmail(e.target.value)}
              required
              className="text-center bg-background/80 backdrop-blur-sm"
            />
            <Button type="submit" variant="primary" className="w-full">
              Join Waitlist
            </Button>
          </form>

          <p className="text-primary font-medium mt-6">
            Bring JustOne to your campus.
          </p>
        </motion.div>
      </section>

      {/* Main footer content */}
      <div className="py-16 px-6 bg-background relative">
        {/* Warm top gradient */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-card/25 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="section-container text-center relative"
        >
          {/* Animated Logo with gradient - click to scroll to top */}
          <div className="mb-6 flex justify-center">
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              animate={{
                filter: [
                  "drop-shadow(0 0 8px hsl(350 47% 33% / 0.3))",
                  "drop-shadow(0 0 16px hsl(350 47% 33% / 0.5))",
                  "drop-shadow(0 0 8px hsl(350 47% 33% / 0.3))",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
              aria-label="Scroll to top"
            >
              <Logo />
            </motion.button>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground font-medium text-sm mb-8 max-w-xs mx-auto">
            One match. One moment.
            <br />
            That's all it takes.
          </p>

          {/* Navigation links */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <Link 
              to="/faqs" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              FAQs
            </Link>
            <Link 
              to="/privacy" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Privacy
            </Link>
            <Link 
              to="/careers" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Careers
            </Link>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <p className="text-muted-foreground font-medium text-sm mb-1">Contact us</p>
            <a 
              href="mailto:support@justonematch.in" 
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              support@justonematch.in
            </a>
          </div>

          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={isVisible ? { opacity: 1, width: 48 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="divider-thin mb-8" 
          />

          {/* Copyright */}
          <p className="text-muted-foreground/50 text-xs font-medium tracking-wide">
            © 2026 JustOne. Private pilot.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
