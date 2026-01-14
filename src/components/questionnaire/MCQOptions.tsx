import { motion } from "framer-motion";

interface MCQOptionsProps {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MCQOptions = ({ options, value, onChange, disabled }: MCQOptionsProps) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <motion.button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: disabled ? 1 : 1.01 }}
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          className={`
            w-full p-4 rounded-sm border text-left transition-all duration-300
            ${value === option
              ? "border-primary bg-primary/5 text-foreground shadow-sm"
              : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-background/60"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span className="font-light">{option}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MCQOptions;
