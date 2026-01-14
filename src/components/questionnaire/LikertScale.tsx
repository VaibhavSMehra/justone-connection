import { motion } from "framer-motion";
import { LIKERT_LABELS } from "@/lib/questionnaire-data";

interface LikertScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const LikertScale = ({ value, onChange, disabled }: LikertScaleProps) => {
  return (
    <div className="space-y-4">
      {/* Scale buttons */}
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <motion.button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`
              flex-1 aspect-square max-w-16 rounded-full flex items-center justify-center
              text-lg font-serif transition-all duration-300
              ${value === num
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-background/60 text-muted-foreground hover:bg-primary/10 hover:text-foreground border border-border/60"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between px-1">
        <span className="text-xs text-muted-foreground/70 text-left max-w-[80px]">
          {LIKERT_LABELS[0]}
        </span>
        <span className="text-xs text-muted-foreground/70 text-center">
          {LIKERT_LABELS[2]}
        </span>
        <span className="text-xs text-muted-foreground/70 text-right max-w-[80px]">
          {LIKERT_LABELS[4]}
        </span>
      </div>

      {/* Selected label display */}
      {value && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-primary font-light"
        >
          {LIKERT_LABELS[value - 1]}
        </motion.p>
      )}
    </div>
  );
};

export default LikertScale;
