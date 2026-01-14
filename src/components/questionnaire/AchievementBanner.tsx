import { motion, AnimatePresence } from "framer-motion";

interface AchievementBannerProps {
  current: number;
  total: number;
}

interface Milestone {
  threshold: number; // percentage
  message: string;
  emoji: string;
}

const milestones: Milestone[] = [
  { threshold: 25, message: "Great start", emoji: "✨" },
  { threshold: 50, message: "Halfway there", emoji: "🌙" },
  { threshold: 75, message: "Almost done", emoji: "💫" },
  { threshold: 90, message: "Final stretch", emoji: "🎯" },
];

const AchievementBanner = ({ current, total }: AchievementBannerProps) => {
  const progress = ((current + 1) / total) * 100;
  const previousProgress = (current / total) * 100;

  // Find if we just crossed a milestone
  const crossedMilestone = milestones.find(
    (m) => previousProgress < m.threshold && progress >= m.threshold
  );

  return (
    <AnimatePresence>
      {crossedMilestone && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-primary/10 border border-primary/20 backdrop-blur-sm rounded-full px-6 py-2.5 shadow-lg">
            <span className="text-sm font-light text-primary">
              <span className="mr-2">{crossedMilestone.emoji}</span>
              {crossedMilestone.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementBanner;
