import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { ref, isVisible } = useScrollAnimation(0.2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section id="waitlist" ref={ref} className="section-spacing px-6 relative">
      {/* Warm background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] via-transparent to-primary/[0.01]" />
      
      <div className="section-container max-w-lg relative">
        {/* Floating card surface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-card/75 backdrop-blur-sm rounded-sm p-10 md:p-12
            border border-border/60 shadow-xl shadow-primary/[0.04]"
        >
          {/* Subtle inner warmth */}
          <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          
          {/* Section header */}
          <div className="text-center mb-10 relative">
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={isVisible ? { opacity: 1, width: 48 } : {}}
              transition={{ duration: 1, delay: 0.3 }}
              className="divider-thin mb-8" 
            />
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Get the Questionnaire
            </h2>
            <p className="text-muted-foreground font-light">
              We'll notify you when access opens for your campus.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8 relative">
              {/* Email input with warm focus glow */}
              <motion.div 
                animate={{ 
                  scale: isFocused ? 1.01 : 1,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                <div className={`absolute -inset-3 rounded-sm bg-primary/5 transition-opacity duration-600 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                <Input
                  type="email"
                  placeholder="Your university email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  required
                  className="text-center relative bg-background/60"
                />
              </motion.div>
              
              <div className="text-center">
                <Button 
                  type="submit" 
                  variant="primary"
                >
                  Get the Questionnaire
                </Button>
              </div>

              {/* Privacy note */}
              <p className="text-center text-muted-foreground/50 text-xs font-light">
                Your email is only used to send your questionnaire link.
                <br />
                No spam. Ever.
              </p>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center py-8 relative"
            >
              <div className="w-12 h-px bg-primary/40 mx-auto mb-6" />
              <p className="font-serif text-xl text-foreground mb-2">
                You're on the list.
              </p>
              <p className="text-muted-foreground font-light text-sm">
                Watch your inbox for the questionnaire.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Waitlist;
