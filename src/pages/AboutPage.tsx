import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Users, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-card/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <Logo />
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h1 className="font-display font-light text-4xl md:text-5xl lg:text-6xl mb-6">
              About <span className="font-logo text-primary">JustOne</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              A different kind of dating experience. One match. One moment. That's all it takes.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <div className="bg-card/50 border border-border/40 rounded-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-primary" />
                <h2 className="font-display text-2xl">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In a world of endless swiping and superficial connections, JustOne takes a radically different approach. 
                We believe that meaningful relationships aren't found through algorithms that maximize engagement. They're 
                discovered through thoughtful matching based on who you really are.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Each cycle, we introduce you to one carefully chosen person from your campus. Not a list of options. 
                Not a stack of profiles to swipe through. Just one person, selected based on genuine compatibility 
                and shared intentions.
              </p>
            </div>
          </motion.section>

          {/* How We're Different */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <h2 className="font-display text-2xl mb-8 text-center">How We're Different</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card/30 border border-border/30 rounded-sm p-6">
                <Sparkles className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-semibold mb-2">No Photos. No Bios.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We match based on your values, intentions, and compatibility, not your profile picture or clever taglines.
                </p>
              </div>
              <div className="bg-card/30 border border-border/30 rounded-sm p-6">
                <Users className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Campus-Only</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every match is someone from your campus. Real connections with real people you might actually run into.
                </p>
              </div>
              <div className="bg-card/30 border border-border/30 rounded-sm p-6">
                <Shield className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Mutual Reveal Only</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You're only introduced if both of you express interest. Until then, everything stays completely anonymous.
                </p>
              </div>
            </div>
          </motion.section>

          {/* The Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <div className="bg-card/50 border border-border/40 rounded-sm p-8 md:p-10">
              <h2 className="font-display text-2xl mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                JustOne was born from a simple frustration: dating apps had become exhausting. The endless swiping, 
                the superficial judgments, the paradox of choice that left people feeling more alone than ever.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We asked: what if there was an app that actually encouraged you to put down your phone? What if 
                instead of giving you 100 mediocre options, we gave you one great one?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                That's JustOne. A dating experience designed to create real connections, not maximize screen time. 
                We're starting with college campuses because that's where meaningful relationships often begin, 
                and because campus communities deserve something better than what's out there.
              </p>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <Button variant="primary" size="lg" onClick={() => navigate("/")}>
              Get Your Match
            </Button>
            <p className="text-muted-foreground text-sm mt-4">
              Questions? Reach out at{" "}
              <a href="mailto:support@justonematch.in" className="text-primary hover:underline">
                support@justonematch.in
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default AboutPage;
