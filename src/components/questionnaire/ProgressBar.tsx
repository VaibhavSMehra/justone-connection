import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  sectionTitle: string;
}

const ProgressBar = ({ current, total, sectionTitle }: ProgressBarProps) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-4 px-6 border-b border-border/30">
      <div className="max-w-2xl mx-auto">
        {/* Section title */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-serif text-primary">{sectionTitle}</span>
          <span className="text-xs text-muted-foreground">
            {current + 1} of {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Time estimate */}
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground/60">
            ~{Math.max(1, Math.ceil((total - current - 1) * 0.1))} min remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
