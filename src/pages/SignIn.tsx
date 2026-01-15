import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { usePostAuthRedirect } from "@/hooks/usePostAuthRedirect";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { useCampus, CAMPUSES } from "@/contexts/CampusContext";

// Admin email allowlist
const ADMIN_EMAILS = [
  "vaibhavmehra2027@u.northwestern.edu",
  "antonyvincent2026@u.northwestern.edu"
];

const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

const isAllowedDomain = (email: string, allowedDomains: string[]): boolean => {
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;
  return allowedDomains.some(d => domain === d || domain.endsWith(`.${d}`));
};

type FlowState = "email" | "otp" | "verifying";
type LoadingState = "idle" | "loading";

const SignIn = () => {
  const { redirectAfterAuth } = usePostAuthRedirect();
  const { selectedCampus } = useCampus();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("email");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const maxResendAttempts = 3;

  // Get all allowed domains from all campuses
  const allAllowedDomains = CAMPUSES.flatMap(c => c.domains);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const normalizedEmail = email.toLowerCase().trim();

    if (isAdminMode) {
      if (!isAdminEmail(normalizedEmail)) {
        setErrorMessage("Admin access only.");
        return;
      }
    } else {
      if (!isAllowedDomain(normalizedEmail, allAllowedDomains)) {
        setErrorMessage("Please use your institutional email from Ashoka / Jindal / CHRIST.");
        return;
      }
    }

    setLoadingState("loading");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: email.trim(), isAdminMode },
      });

      if (error) {
        const errorMsg = error.message || '';
        const isRateLimited = errorMsg.includes("429") || 
                              errorMsg.toLowerCase().includes("rate") ||
                              errorMsg.toLowerCase().includes("too many");
        
        if (isRateLimited) {
          setErrorMessage("Too many requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage("Failed to send verification code. Please try again.");
        }
        setLoadingState("idle");
        return;
      }

      if (!data?.success) {
        const isRateLimited = data?.error === "rate_limited" || 
                              data?.message?.toLowerCase().includes("too many");
        
        if (isRateLimited) {
          setErrorMessage("Too many requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage(data?.message || "Failed to send verification code.");
        }
        setLoadingState("idle");
        return;
      }

      setFlowState("otp");
      setLoadingState("idle");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setLoadingState("idle");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoadingState("loading");
    setErrorMessage("");
    setFlowState("verifying");

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: email.trim(), code: otp, isAdminMode },
      });

      if (error) {
        const errorMsg = error.message || '';
        const respData = data as { error?: string; message?: string } | null;
        
        const isInvalidCode = respData?.error === "invalid_code" || 
                              errorMsg.toLowerCase().includes("invalid") ||
                              respData?.message?.toLowerCase().includes("invalid");
        
        if (isInvalidCode) {
          setErrorMessage(respData?.message || "Incorrect code. Please check and try again.");
        } else {
          setErrorMessage(respData?.message || "Verification failed. Please try again.");
        }
        setFlowState("otp");
        setLoadingState("idle");
        return;
      }

      if (!data?.success) {
        setErrorMessage(data?.message || "Verification failed. Please try again.");
        setFlowState("otp");
        setLoadingState("idle");
        return;
      }

      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setErrorMessage("Failed to establish session. Please try again.");
          setFlowState("otp");
          setLoadingState("idle");
          return;
        }
        
        const success = await redirectAfterAuth();
        
        if (!success) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const retrySuccess = await redirectAfterAuth();
          
          if (!retrySuccess) {
            setErrorMessage("Session established but profile not ready. Please refresh the page.");
            setFlowState("otp");
            setLoadingState("idle");
          }
        }
      } else {
        setErrorMessage("Session not received. Please try again.");
        setFlowState("otp");
        setLoadingState("idle");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setFlowState("otp");
      setLoadingState("idle");
    }
  };

  const handleResendCode = async () => {
    if (resendCount >= maxResendAttempts || isResending) return;

    setIsResending(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: email.trim(), isAdminMode },
      });

      if (error) {
        const errorMsg = error.message || '';
        const isRateLimited = errorMsg.includes("429") || 
                              errorMsg.toLowerCase().includes("rate") ||
                              errorMsg.toLowerCase().includes("too many");
        
        if (isRateLimited) {
          setErrorMessage("Too many requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage("Failed to resend code. Please try again.");
        }
      } else if (!data?.success) {
        const isRateLimited = data?.error === "rate_limited" || 
                              data?.message?.toLowerCase().includes("too many");
        
        if (isRateLimited) {
          setErrorMessage("Too many requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage(data?.message || "Failed to resend code. Please try again.");
        }
      } else {
        setResendCount(prev => prev + 1);
        setOtp("");
        setErrorMessage("");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isLoading = loadingState === "loading";
  const hasValidEmail = email.includes("@") && (
    isAdminMode 
      ? isAdminEmail(email) 
      : isAllowedDomain(email, allAllowedDomains)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 px-6 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border/40 rounded-sm p-8 shadow-lg">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo size="large" />
            </div>

            <h1 className="font-serif text-2xl text-center text-foreground mb-2">
              {isAdminMode ? "Admin Sign In" : "Sign In"}
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-8">
              {isAdminMode 
                ? "Enter your admin email to continue" 
                : "Enter your campus email to get started"
              }
            </p>

            {flowState === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  type="email"
                  placeholder="your.name@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="text-center bg-background/60"
                />

                {errorMessage && (
                  <p className="text-center text-destructive text-sm">{errorMessage}</p>
                )}
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading}
                  className={`w-full transition-all duration-300 ${
                    !email 
                      ? '' 
                      : hasValidEmail 
                        ? '' 
                        : 'opacity-50 saturate-0'
                  }`}
                >
                  {isLoading ? "Sending..." : "Continue"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdminMode(!isAdminMode);
                    setErrorMessage("");
                  }}
                  className="block mx-auto text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
                >
                  {isAdminMode ? "Switch to Student Sign In" : "Admin Sign In"}
                </button>
              </form>
            )}

            {(flowState === "otp" || flowState === "verifying") && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-center text-muted-foreground text-sm mb-2">
                  Enter the 6-digit code sent to {email}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading || flowState === "verifying"}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {errorMessage && (
                  <p className="text-center text-destructive text-sm">{errorMessage}</p>
                )}

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading || otp.length !== 6}
                  className="w-full"
                >
                  {flowState === "verifying" ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="flex justify-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || resendCount >= maxResendAttempts}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : `Resend code${resendCount > 0 ? ` (${maxResendAttempts - resendCount} left)` : ''}`}
                  </button>
                  <span className="text-muted-foreground/30">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowState("email");
                      setOtp("");
                      setErrorMessage("");
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SignIn;
