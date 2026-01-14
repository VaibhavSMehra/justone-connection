import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Clock } from "lucide-react";

interface WelcomePageProps {
  onStart: () => void;
  email?: string;
}

const WelcomePage = ({ onStart, email }: WelcomePageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center max-w-lg mx-auto"
    >
      <div className="divider-thin mb-8" />
      
      <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
        Welcome to JustOne
      </h1>
      
      <p className="text-muted-foreground font-light leading-relaxed mb-8">
        You're about to answer a short questionnaire that helps us find your most compatible match on campus.
      </p>

      {/* Key points */}
      <div className="space-y-4 mb-10 text-left">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm mb-1">Takes about 5-7 minutes</h3>
            <p className="text-muted-foreground text-sm font-light">
              Answer honestly — there are no right or wrong answers.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm mb-1">Your answers are private</h3>
            <p className="text-muted-foreground text-sm font-light">
              We encrypt everything. Your responses are never shared.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm mb-1">One match at a time</h3>
            <p className="text-muted-foreground text-sm font-light">
              No swiping, no games — just one thoughtful introduction.
            </p>
          </div>
        </div>
      </div>

      {email && (
        <p className="text-muted-foreground/60 text-sm font-light mb-6">
          Signed in as <span className="text-foreground">{email}</span>
        </p>
      )}

      <Button variant="primary" size="lg" onClick={onStart} className="min-w-[200px]">
        Begin Questionnaire
      </Button>
    </motion.div>
  );
};

export default WelcomePage;
