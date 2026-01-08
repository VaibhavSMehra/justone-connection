import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const trustPoints = [
  {
    title: "Intent-aware matching",
    description: "Not everyone is looking for the same thing — and that's okay. We match people who are aligned, not just available.",
  },
  {
    title: "Campus-restricted",
    description: "Only verified students from your university. No outsiders. No randoms.",
  },
  {
    title: "Anonymous until mutual",
    description: "No exposure. No awkwardness. You're revealed only when both people say yes.",
  },
  {
    title: "No public profiles",
    description: "Nothing to browse. Nothing to perform. Just one introduction at a time.",
  },
  {
    title: "Private pilot",
    description: "Careful rollout across select campuses.",
  },
];

const Trust = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section ref={ref} className="section-spacing px-6 relative overflow-hidden">
      {/* Layered warm background */}
      <div className="absolute inset-0 bg-card/50" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] via-transparent to-transparent" />
      
      {/* Subtle texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="section-container relative">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={isVisible ? { opacity: 1, width: 48 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="divider-thin mb-8" 
          />
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Why JustOne is different
          </h2>
          <p className="text-muted-foreground font-light max-w-md mx-auto">
            Your privacy isn't a feature. It's the foundation.
          </p>
        </motion.div>

        {/* Trust points - Grid layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 25 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.7, 
                delay: 0.25 + index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="group"
            >
              {/* Card with warm lift hover */}
              <div className="p-6 rounded-sm border border-transparent bg-background/60 h-full
                transition-all duration-700 ease-out
                hover:border-border/70 hover:bg-background/95 
                hover:shadow-lg hover:shadow-primary/8
                hover:-translate-y-1 hover:brightness-[1.01]">
                <h3 className="font-serif text-lg text-foreground mb-2 
                  transition-colors duration-700 group-hover:text-primary">
                  {point.title}
                </h3>
                <p className="text-muted-foreground font-light text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-center text-foreground/70 text-sm font-light mt-16 max-w-md mx-auto space-y-2"
        >
          <p>We don't sell data.</p>
          <p>We don't run ads.</p>
          <p>We don't optimize for addiction.</p>
          <p className="text-foreground pt-4 font-normal">
            We optimize for one good connection.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Trust;
