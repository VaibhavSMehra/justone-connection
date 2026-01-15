import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "default" | "large" | "hero";
}

const Logo = ({ size = "default" }: LogoProps) => {
  const isLarge = size === "large";
  const isHero = size === "hero";
  
  const iconSize = isHero 
    ? "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28" 
    : isLarge 
      ? "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" 
      : "w-7 h-7 sm:w-8 sm:h-8";
  
  const textSize = isHero 
    ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl" 
    : isLarge 
      ? "text-3xl sm:text-4xl md:text-5xl" 
      : "text-xl sm:text-2xl";
  
  const gap = isHero ? "gap-3 sm:gap-4 md:gap-5" : isLarge ? "gap-2 sm:gap-3 md:gap-4" : "gap-2 sm:gap-3";
  
  return (
    <Link to="/" className={`flex items-center ${gap} cursor-pointer hover:opacity-90 transition-opacity`}>
      {/* Heart with 1 cutout - using primary (burgundy) color */}
      <motion.div 
        className={`relative ${iconSize}`}
        whileHover={{ 
          scale: [1, 1.08, 1.04, 1.08, 1],
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
        >
          <defs>
            <mask id={`one-cutout-${size}`}>
              <rect width="100" height="100" fill="white" />
              {/* The "1" shape cutout */}
              <path 
                d="M45 25 L55 25 L55 75 L45 75 L45 35 L38 42 L32 36 L45 25 Z" 
                fill="black"
              />
            </mask>
          </defs>
          {/* Heart shape with cutout */}
          <path 
            d="M50 88 C20 65 5 50 5 35 C5 20 17 10 30 10 C40 10 47 17 50 22 C53 17 60 10 70 10 C83 10 95 20 95 35 C95 50 80 65 50 88 Z"
            className="fill-primary"
            mask={`url(#one-cutout-${size})`}
          />
        </svg>
      </motion.div>
      <span className={`font-logo tracking-tight ${textSize}`}>
        <span className="text-foreground">Just</span>
        <span className="text-primary">One</span>
        <sup className="text-[0.4em] text-muted-foreground ml-0.5 align-super">™</sup>
      </span>
    </Link>
  );
};

export default Logo;
