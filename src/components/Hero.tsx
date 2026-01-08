import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroCampusImage from "@/assets/hero-campus.jpg";

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Cinematic campus background with couple stargazing - parallax effect */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ 
          backgroundImage: `url(${heroCampusImage})`,
          y: backgroundY
        }}
      />
      
      {/* Subtle breathing glow in the sky - barely perceptible */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/[0.03] to-primary/[0.08]"
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Animated starfield - very subtle twinkling */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-background/40 rounded-full"
            style={{
              left: `${8 + Math.random() * 84}%`,
              top: `${3 + Math.random() * 35}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 12,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Shooting stars - realistic and subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`shooting-${i}`}
            className="absolute"
            style={{
              left: `${5 + i * 40}%`,
              top: `${8 + i * 12}%`,
            }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.6, 0],
              x: [0, 120, 240],
              y: [0, 60, 120],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: 12 + i * 18,
              repeatDelay: 25 + i * 15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            {/* Star head - small bright point */}
            <div 
              className="w-1 h-1 rounded-full bg-white/90"
              style={{
                boxShadow: '0 0 4px 1px rgba(255,255,255,0.6), 0 0 8px 2px rgba(255,255,255,0.3)',
              }}
            />
            {/* Long fading tail */}
            <div 
              className="absolute top-1/2 right-full h-px origin-right"
              style={{
                width: '80px',
                background: 'linear-gradient(to left, rgba(255,255,255,0.5), rgba(255,255,255,0.2) 30%, transparent)',
                transform: 'translateY(-50%) rotate(-27deg)',
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Warm gradient overlay - reduced opacity to show couple */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/50" />
      
      {/* Paper grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Frosted vellum content container - centered */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="backdrop-blur-xl bg-background/65 border border-border/40 rounded-sm px-10 py-14 md:px-16 md:py-20 shadow-2xl shadow-foreground/5 max-w-3xl"
        >
          {/* Subtle inner warmth */}
          <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          
          {/* Logo - now hero size */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 relative flex justify-center"
          >
            <Logo size="hero" />
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-3 text-balance leading-tight relative"
          >
            On Your Campus.
          </motion.h1>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary mb-10 text-balance leading-tight relative"
          >
            One Match. No Swipes.
          </motion.h2>

          {/* Subtext */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground text-base md:text-lg font-light leading-relaxed mb-12 max-w-xl mx-auto relative"
          >
            Tell us who you are — and what you're actually looking for.
            <br />
            Each cycle, we introduce you to one carefully chosen person from your campus, aligned with your intent.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <Button 
              variant="primary" 
              onClick={scrollToWaitlist}
            >
              Get the Questionnaire
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator - subtle breathing line */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          animate={{ scaleY: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-primary/30 to-transparent origin-top" 
        />
      </motion.div>
    </section>
  );
};

export default Hero;
