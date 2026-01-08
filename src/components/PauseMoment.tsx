import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import pauseMomentImage from "@/assets/pause-moment.jpg";

interface LightParticle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

const PauseMoment = () => {
  const [particles, setParticles] = useState<LightParticle[]>([]);
  const [imageWarmth, setImageWarmth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Fade out particles over time
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, opacity: p.opacity - 0.02, scale: p.scale * 0.98 }))
          .filter(p => p.opacity > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Reset warmth when cursor leaves
  useEffect(() => {
    const handleMouseLeave = () => {
      setImageWarmth(0);
    };
    const container = containerRef.current;
    container?.addEventListener('mouseleave', handleMouseLeave);
    return () => container?.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate distance from last position
    const dx = x - lastPositionRef.current.x;
    const dy = y - lastPositionRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only create particles if moved enough
    if (distance > 15) {
      lastPositionRef.current = { x, y };
      
      // Create new light particle
      const newParticle: LightParticle = {
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        opacity: 0.7 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
      };
      
      setParticles(prev => [...prev.slice(-30), newParticle]);
    }
    
    // Calculate warmth based on proximity to center (where couple would be)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distToCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );
    const maxDist = Math.sqrt(
      Math.pow(rect.width / 2, 2) + Math.pow(rect.height / 2, 2)
    );
    const warmth = Math.max(0, 1 - distToCenter / maxDist) * 0.3;
    setImageWarmth(warmth);
  }, []);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-[60vh] min-h-[480px] overflow-hidden cursor-default"
    >
      {/* Background image - couple walking on campus at night */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ 
          backgroundImage: `url(${pauseMomentImage})`,
          filter: `brightness(${1 + imageWarmth * 0.15}) saturate(${1 + imageWarmth * 0.2})`,
        }}
      />
      
      {/* Warm gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
      
      {/* Paper grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Cursor-following light particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: particle.opacity,
              scale: particle.scale,
            }}
            style={{
              left: particle.x - 12,
              top: particle.y - 12,
              width: 24,
              height: 24,
              background: `radial-gradient(circle, 
                hsla(42, 80%, 85%, ${particle.opacity}) 0%, 
                hsla(42, 70%, 75%, ${particle.opacity * 0.5}) 40%, 
                transparent 70%)`,
              boxShadow: `0 0 20px hsla(42, 80%, 80%, ${particle.opacity * 0.5})`,
            }}
            transition={{
              opacity: { duration: 0.1 },
              scale: { duration: 0.15, ease: "easeOut" },
            }}
          />
        ))}
      </div>
      
      {/* Centered content */}
      <div className="relative h-full flex items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-xl px-8"
        >
          {/* Frosted vellum card */}
          <div className="backdrop-blur-lg bg-background/60 border border-border/40 rounded-sm px-12 py-10 shadow-2xl shadow-foreground/5">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, delay: 0.4 }}
              className="font-serif text-2xl md:text-3xl text-foreground/90 leading-relaxed italic"
            >
              Some moments only need one person.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, delay: 1 }}
              className="mt-5 text-primary font-serif text-lg"
            >
              One is enough.
            </motion.p>
          </div>
        </motion.div>
      </div>
      
      {/* Ambient glow that follows cursor activity */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: imageWarmth }}
        transition={{ duration: 0.5 }}
        style={{
          background: `radial-gradient(ellipse at center, hsla(42, 60%, 70%, 0.1) 0%, transparent 60%)`,
        }}
      />
    </section>
  );
};

export default PauseMoment;
