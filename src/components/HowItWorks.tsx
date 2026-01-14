import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  {
    number: "01",
    title: "Set your intent",
    description: "A short, thoughtful questionnaire about you, your values, and the kind of connection you want right now. No bios. No posturing.",
  },
  {
    number: "02",
    title: "We choose one match",
    description: "One person. Same campus. Matched based on compatibility and relationship intent: long-term, short-term, or open to either.",
  },
  {
    number: "03",
    title: "Mutual reveal",
    description: "You're introduced only if interest is mutual. Until then, everything stays anonymous.",
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section ref={ref} className="section-spacing px-6 relative">
      {/* Layered background with warm depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] via-transparent to-primary/[0.01]" />
      
      <div className="section-container relative">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={isVisible ? { opacity: 1, width: 48 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="divider-thin mb-8" 
          />
          <h2 className="font-display font-light text-3xl md:text-4xl text-foreground tracking-wide">
            How it <span className="text-primary">works</span>
          </h2>
        </motion.div>

        {/* Steps - Cards with depth and warmth */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <motion.div 
              key={step.number}
              initial={{ opacity: 0, y: 35 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.8, 
                delay: 0.2 + index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="group relative"
            >
              {/* Card surface with warm lift on hover */}
              <div className="relative bg-card/70 backdrop-blur-sm rounded-sm p-8 md:p-10 
                border border-border/60 shadow-sm
                transition-all duration-700 ease-out
                hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30
                hover:bg-card hover:-translate-y-1.5
                hover:brightness-[1.02]">
                
                {/* Step number */}
                <span className="inline-block text-xs tracking-[0.2em] text-primary/40 uppercase mb-6
                  group-hover:text-primary/70 transition-colors duration-700">
                  {step.number}
                </span>
                
                {/* Title */}
                <h3 className="font-display text-xl md:text-2xl text-foreground mb-4 tracking-wide
                  transition-colors duration-700 group-hover:text-foreground">
                  {step.title}
                </h3>
                
                {/* Divider - fades in with scroll */}
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={isVisible ? { opacity: 1, width: 32 } : {}}
                  transition={{ duration: 1, delay: 0.5 + index * 0.12 }}
                  className="h-px bg-primary/20 mb-4 
                    transition-all duration-700 group-hover:bg-primary/40 group-hover:w-12" 
                />
                
                {/* Description */}
                <p className="text-muted-foreground font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Closing statement */}
      </div>
    </section>
  );
};

export default HowItWorks;
