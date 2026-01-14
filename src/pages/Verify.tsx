import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type VerifyStep = "email" | "otp" | "success";

const Verify = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<VerifyStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campusName, setCampusName] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("send-waitlist-otp", {
        body: { email },
      });

      if (response.error) {
        setError(response.error.message || "Failed to send verification code");
        return;
      }

      const data = response.data;

      if (data.error === "domain_not_allowed") {
        setError(data.message);
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setCampusName(data.campus_name);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("verify-waitlist-otp", {
        body: { email, code: otp },
      });

      if (response.error) {
        setError(response.error.message || "Verification failed");
        return;
      }

      const data = response.data;

      if (!data?.success) {
        setError(data?.message || "Verification failed");
        return;
      }

      // Set the session with the tokens
      if (data.session?.access_token && data.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        await refreshProfile();
        setStep("success");
        
        // Navigate to questionnaire after a moment
        setTimeout(() => {
          navigate("/questionnaire");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("send-waitlist-otp", {
        body: { email },
      });

      if (response.error || response.data?.error) {
        setError("Failed to resend code. Please try again.");
        return;
      }

      setError(null);
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-card/75 backdrop-blur-sm rounded-sm p-10 md:p-12 border border-border/60 shadow-xl shadow-primary/[0.04]">
            {/* Subtle inner warmth */}
            <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

            {step === "email" && (
              <>
                <div className="text-center mb-8">
                  <div className="divider-thin mb-6" />
                  <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                    Verify Your Campus Email
                  </h1>
                  <p className="text-muted-foreground font-light text-sm">
                    We'll send a verification code to your university email.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="email"
                      placeholder="your.name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="text-center bg-background/60"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm text-destructive bg-destructive/10 rounded-sm py-3 px-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="text-center">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? "Sending..." : "Send Verification Code"}
                    </Button>
                  </div>
                </form>

                <p className="text-center text-muted-foreground/50 text-xs font-light mt-6">
                  Currently available for select campuses only.
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="text-center mb-8">
                  <div className="divider-thin mb-6" />
                  <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                    Enter Verification Code
                  </h1>
                  <p className="text-muted-foreground font-light text-sm">
                    We sent a 6-digit code to <span className="text-foreground">{email}</span>
                    {campusName && (
                      <>
                        <br />
                        <span className="text-primary">{campusName}</span>
                      </>
                    )}
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      disabled={loading}
                      maxLength={6}
                      className="text-center text-2xl tracking-[0.5em] bg-background/60 font-mono"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm text-destructive bg-destructive/10 rounded-sm py-3 px-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="text-center space-y-3">
                    <Button type="submit" variant="primary" disabled={loading || otp.length !== 6}>
                      {loading ? "Verifying..." : "Verify"}
                    </Button>
                    
                    <div>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                      >
                        Didn't receive the code? Resend
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError(null);
                      }}
                      className="text-muted-foreground/60 text-xs hover:text-muted-foreground transition-colors"
                    >
                      Use a different email
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="divider-thin mb-6" />
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-2">
                  Welcome to JustOne
                </h2>
                <p className="text-muted-foreground font-light text-sm">
                  Taking you to the questionnaire...
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default Verify;
