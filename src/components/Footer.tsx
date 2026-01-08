import { motion } from "framer-motion";
import Logo from "./Logo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Footer = () => {
  const { ref, isVisible } = useScrollAnimation(0.3);

  return (
    <footer ref={ref} className="py-20 px-6 relative">
      {/* Warm top gradient */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-card/25 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="section-container text-center relative"
      >
        {/* Logo */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Tagline */}
        <p className="text-muted-foreground font-light text-sm mb-10 max-w-xs mx-auto">
          One match. One moment.
          <br />
          That's all it takes.
        </p>

        {/* Divider */}
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={isVisible ? { opacity: 1, width: 48 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="divider-thin mb-10" 
        />

        {/* Copyright */}
        <p className="text-muted-foreground/40 text-xs font-light tracking-wide">
          © 2026 JustOne. Private pilot.
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
