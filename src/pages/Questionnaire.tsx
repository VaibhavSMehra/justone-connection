import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProgressBar from "@/components/questionnaire/ProgressBar";
import QuestionCard from "@/components/questionnaire/QuestionCard";
import AchievementBanner from "@/components/questionnaire/AchievementBanner";
import PhotoUpload from "@/components/questionnaire/PhotoUpload";
import WelcomePage from "@/components/questionnaire/WelcomePage";
import { getFlattenedQuestions, QUESTIONNAIRE_VERSION } from "@/lib/questionnaire-data";

// Physical attraction question ID
const PHYSICAL_ATTRACTION_QUESTION_ID = "q46_physical_important";

const Questionnaire = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Get randomized questions once on mount
  const questions = useMemo(() => getFlattenedQuestions(), []);
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Check if user values physical attraction (answered 4 or 5 on likert)
  const valuesPhysicalAttraction = useMemo(() => {
    const answer = answers[PHYSICAL_ATTRACTION_QUESTION_ID];
    return typeof answer === "number" && answer >= 4;
  }, [answers]);

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (!currentQuestion.required) return true;
    if (answer === "skipped") return true;
    if (answer === null || answer === undefined) return false;
    if (typeof answer === "string") return answer.trim().length > 0;
    return true;
  };

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (canProceed() && currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Auto-advance after answering
  useEffect(() => {
    const answer = answers[currentQuestion?.id];
    if (answer && !isLastQuestion) {
      const timer = setTimeout(() => handleNext(), 400);
      return () => clearTimeout(timer);
    }
  }, [answers[currentQuestion?.id]]);

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError("Session expired. Please sign in again.");
        navigate("/");
        return;
      }

      const response = await supabase.functions.invoke("submit-responses", {
        body: { 
          answers, 
          questionnaire_version: QUESTIONNAIRE_VERSION,
          photo: photoBase64 || undefined,
        },
      });

      if (response.error || response.data?.error) {
        setError(response.error?.message || response.data?.error || "Failed to submit");
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // If user values physical attraction and hasn't seen photo upload yet, show it
    if (valuesPhysicalAttraction && !showPhotoUpload) {
      setShowPhotoUpload(true);
    } else {
      handleFinalSubmit();
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
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">You're In</h1>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              Your responses have been securely saved. When a match is found, we'll introduce you to one carefully chosen person from your campus.
            </p>
            <p className="text-muted-foreground/60 text-sm font-light">
              We'll reach out to <span className="text-foreground">{profile?.email}</span> when it's time.
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // Welcome page view
  if (showWelcome) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-6 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          <button onClick={handleSignOut} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Sign out
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <WelcomePage 
            onStart={() => setShowWelcome(false)} 
            email={profile?.email}
          />
        </div>
      </main>
    );
  }

  // Photo upload view
  if (showPhotoUpload) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4 flex justify-between items-center border-b border-border/30">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>
          <button onClick={handleSignOut} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Sign out
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            <PhotoUpload 
              onPhotoSelected={setPhotoBase64} 
              disabled={loading}
            />

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-destructive mt-4">
                {error}
              </motion.p>
            )}

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={handleFinalSubmit} 
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button variant="primary" onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <AchievementBanner current={currentIndex} total={questions.length} />
      
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/30">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>
        <button onClick={handleSignOut} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
          Sign out
        </button>
      </header>

      <ProgressBar current={currentIndex} total={questions.length} sectionTitle={currentQuestion.sectionTitle} />

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <QuestionCard
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
            isActive={true}
            disabled={loading}
          />

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-destructive mt-4">
              {error}
            </motion.p>
          )}

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`text-sm transition-colors ${currentIndex === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}`}
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <Button variant="primary" onClick={handleSubmit} disabled={!canProceed() || loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
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
