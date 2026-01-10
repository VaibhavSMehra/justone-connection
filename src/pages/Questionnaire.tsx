import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const QUESTIONNAIRE_VERSION = "v1.0";

interface Question {
  id: string;
  type: "text" | "textarea" | "choice" | "multi-choice";
  question: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const questions: Question[] = [
  {
    id: "looking_for",
    type: "choice",
    question: "What are you looking for?",
    options: ["A meaningful connection", "Friendship first", "Open to see where it goes", "Something serious"],
    required: true,
  },
  {
    id: "describe_yourself",
    type: "textarea",
    question: "How would your closest friend describe you?",
    placeholder: "Be honest and thoughtful...",
    required: true,
  },
  {
    id: "ideal_evening",
    type: "choice",
    question: "Your ideal evening looks like...",
    options: ["Deep conversation over coffee", "Adventure and spontaneity", "Quiet night in with a book/movie", "Social gathering with friends"],
    required: true,
  },
  {
    id: "values",
    type: "multi-choice",
    question: "Select the values most important to you (choose up to 3):",
    options: ["Honesty", "Ambition", "Kindness", "Humor", "Intelligence", "Creativity", "Loyalty", "Independence"],
    required: true,
  },
  {
    id: "dealbreakers",
    type: "textarea",
    question: "What's something you absolutely need in a partner?",
    placeholder: "What matters most to you...",
    required: true,
  },
  {
    id: "free_time",
    type: "text",
    question: "How do you spend your free time?",
    placeholder: "Your passions, hobbies, interests...",
    required: true,
  },
  {
    id: "conversation_starter",
    type: "textarea",
    question: "What topic could you talk about for hours?",
    placeholder: "Philosophy, music, startups, art...",
    required: true,
  },
  {
    id: "future_vision",
    type: "textarea",
    question: "Where do you see yourself in 5 years?",
    placeholder: "Your dreams and aspirations...",
    required: false,
  },
];

const Questionnaire = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleMultiChoice = (option: string) => {
    const current = (answers[currentQuestion.id] as string[]) || [];
    if (current.includes(option)) {
      handleAnswer(current.filter((o) => o !== option));
    } else if (current.length < 3) {
      handleAnswer([...current, option]);
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (!currentQuestion.required) return true;
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer.trim().length > 0;
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setError("Session expired. Please sign in again.");
        navigate("/verify");
        return;
      }

      const response = await supabase.functions.invoke("submit-responses", {
        body: {
          answers,
          questionnaire_version: QUESTIONNAIRE_VERSION,
        },
      });

      if (response.error) {
        setError(response.error.message || "Failed to submit responses");
        return;
      }

      if (response.data?.error) {
        setError(response.data.error);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-6 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="divider-thin mb-8" />
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              You're In
            </h1>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              Your responses have been securely saved. When a match is found, 
              we'll introduce you to one carefully chosen person from your campus.
            </p>
            <p className="text-muted-foreground/60 text-sm font-light">
              We'll reach out to <span className="text-foreground">{profile?.email}</span> when it's time.
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>
        <button
          onClick={handleSignOut}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Progress bar */}
      <div className="px-6">
        <div className="max-w-lg mx-auto">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-center text-muted-foreground/60 text-xs mt-2">
            {currentIndex + 1} of {questions.length}
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card/75 backdrop-blur-sm rounded-sm p-8 md:p-10 border border-border/60 shadow-xl shadow-primary/[0.04]"
            >
              <h2 className="font-serif text-xl md:text-2xl text-foreground mb-6 text-center">
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === "text" && (
                <Input
                  value={(answers[currentQuestion.id] as string) || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="text-center bg-background/60"
                />
              )}

              {currentQuestion.type === "textarea" && (
                <Textarea
                  value={(answers[currentQuestion.id] as string) || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="min-h-[120px] bg-background/60 resize-none"
                />
              )}

              {currentQuestion.type === "choice" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 rounded-sm border text-left transition-all ${
                        answers[currentQuestion.id] === option
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "multi-choice" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => {
                    const selected = ((answers[currentQuestion.id] as string[]) || []).includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => handleMultiChoice(option)}
                        className={`w-full p-4 rounded-sm border text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-destructive mt-4"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`text-sm transition-colors ${
                currentIndex === 0
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Questionnaire;
