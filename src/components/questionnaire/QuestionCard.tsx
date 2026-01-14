import { motion, AnimatePresence } from "framer-motion";
import { FlatQuestion } from "@/lib/questionnaire-data";
import LikertScale from "./LikertScale";
import MCQOptions from "./MCQOptions";

interface QuestionCardProps {
  question: FlatQuestion;
  answer: any;
  onAnswer: (value: any) => void;
  isActive: boolean;
  disabled?: boolean;
}

const QuestionCard = ({ question, answer, onAnswer, isActive, disabled }: QuestionCardProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`
          relative bg-card/75 backdrop-blur-sm rounded-sm p-8 md:p-10
          border border-border/60 shadow-xl shadow-primary/[0.04]
          transition-all duration-300
          ${isActive ? "scale-100" : "scale-95 pointer-events-none"}
        `}
      >
        {/* Subtle warm gradient */}
        <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
        
        {/* Question number badge */}
        <div className="absolute top-4 right-4">
          <span className="text-xs text-muted-foreground/50">
            {question.questionIndex + 1}/{question.totalInSection}
          </span>
        </div>

        {/* Question text */}
        <h2 className="font-serif text-xl md:text-2xl text-foreground mb-8 text-center leading-relaxed pr-8">
          {question.text}
        </h2>

        {/* Answer component based on type */}
        <div className="relative">
          {question.type === "likert" && (
            <LikertScale
              value={answer as number | null}
              onChange={onAnswer}
              disabled={disabled || !isActive}
            />
          )}

          {question.type === "mcq" && question.options && (
            <MCQOptions
              options={question.options}
              value={answer as string | null}
              onChange={onAnswer}
              disabled={disabled || !isActive}
            />
          )}
        </div>

        {/* Skip option for skipable questions */}
        {question.skipable && !answer && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => onAnswer("skipped")}
            className="mt-6 w-full text-center text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Skip this question
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
