import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

type FlowState = "email" | "otp" | "verifying";
type LoadingState = "idle" | "loading";

// Allowed university email domains
const ALLOWED_DOMAINS = [
  "ashoka.edu.in",
  "northwestern.edu",
  "christuniversity.in",
  "christcollege.edu",
  "res.christuniversity.in",
  "mba.christuniversity.in"
];

const isAllowedDomain = (email: string): boolean => {
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
};

const Waitlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("email");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [domainWarning, setDomainWarning] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { ref, isVisible } = useScrollAnimation(0.2);

  // Validate email domain on change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value.includes("@") && value.split("@")[1]?.length > 0) {
      if (!isAllowedDomain(value)) {
        setDomainWarning("Please use your Ashoka University, Northwestern University, or Christ College email.");
      } else {
        setDomainWarning("");
      }
    } else {
      setDomainWarning("");
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Client-side domain check
    if (!isAllowedDomain(email)) {
      setErrorMessage("Please use your Ashoka University, Northwestern University, or Christ College email address.");
      return;
    }

    setLoadingState("loading");
    setErrorMessage("");
    setDomainWarning("");

    try {
      console.log("[Waitlist] Sending OTP to:", email);

      const { data, error } = await supabase.functions.invoke("send-waitlist-otp", {
        body: { email: email.trim() },
      });

      if (error) {
        console.error("[Waitlist] send-waitlist-otp error:", error.message);
        setErrorMessage(error.message || "Failed to send verification code.");
        setLoadingState("idle");
        return;
      }

      if (!data?.success) {
        console.error("[Waitlist] API error:", data?.error, data?.message);
        setErrorMessage(data?.message || "Failed to send verification code.");
        setLoadingState("idle");
        return;
      }

      console.log("[Waitlist] OTP sent successfully");
      setFlowState("otp");
      setLoadingState("idle");

    } catch (err: any) {
      console.error("[Waitlist] Unexpected error:", err);
      setErrorMessage("Network error. Please try again.");
      setLoadingState("idle");
    }
  };

  // Step 2: Verify OTP and login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoadingState("loading");
    setErrorMessage("");
    setFlowState("verifying");

    try {
      console.log("[Waitlist] Verifying OTP");

      const { data, error } = await supabase.functions.invoke("verify-waitlist-otp", {
        body: { email: email.trim(), code: otp },
      });

      if (error) {
        console.log("[Waitlist] verify-waitlist-otp error:", error.message);
        toast({
          title: "Incorrect Code",
          description: error.message || "Please check your code and try again.",
        });
        setFlowState("otp");
        setLoadingState("idle");
        return;
      }

      if (!data?.success) {
        console.log("[Waitlist] Verification failed:", data?.error, data?.message);
        // Show toast for invalid code instead of inline error
        toast({
          title: "Incorrect Code",
          description: data?.message || "Please check your code and try again.",
        });
        setFlowState("otp");
        setLoadingState("idle");
        return;
      }

      console.log("[Waitlist] Verified successfully, setting session...");

      // Set the session from the server response
      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          console.error("[Waitlist] Session set failed:", sessionError);
          setErrorMessage("Failed to create session. Please try again.");
          setFlowState("otp");
          setLoadingState("idle");
          return;
        }

        console.log("[Waitlist] Session set, redirecting to questionnaire");
        navigate("/questionnaire");
      } else {
        setErrorMessage("Session not received. Please try again.");
        setFlowState("otp");
        setLoadingState("idle");
      }

    } catch (err: any) {
      console.error("[Waitlist] Unexpected error:", err);
      setErrorMessage("Network error. Please try again.");
      setFlowState("otp");
      setLoadingState("idle");
    }
  };

  const handleResendOtp = async () => {
    setOtp("");
    setErrorMessage("");
    setLoadingState("loading");

    try {
      const { data, error } = await supabase.functions.invoke("send-waitlist-otp", {
        body: { email: email.trim() },
      });

      if (error || !data?.success) {
        setErrorMessage(data?.message || error?.message || "Failed to resend code.");
      } else {
        setErrorMessage("");
      }
    } catch {
      setErrorMessage("Failed to resend code.");
    }
    setLoadingState("idle");
  };

  const isLoading = loadingState === "loading";
  const hasValidEmail = email.includes("@") && isAllowedDomain(email);

  return (
    <section id="waitlist" ref={ref} className="section-spacing px-6 relative">
      {/* Warm background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] via-transparent to-primary/[0.01]" />
      
      <div className="section-container max-w-lg relative">
        {/* Floating card surface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-card/75 backdrop-blur-sm rounded-sm p-10 md:p-12
            border border-border/60 shadow-xl shadow-primary/[0.04]"
        >
          {/* Subtle inner warmth */}
          <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          
          {/* Section header */}
          <div className="text-center mb-10 relative">
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={isVisible ? { opacity: 1, width: 48 } : {}}
              transition={{ duration: 1, delay: 0.3 }}
              className="divider-thin mb-8" 
            />
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              {flowState === "otp" || flowState === "verifying" ? "Verify Your Email" : "Begin the Questionnaire"}
            </h2>
            <p className="text-muted-foreground font-light">
              {flowState === "email" && "Enter your university email to start."}
              {(flowState === "otp" || flowState === "verifying") && `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Email Form */}
          {flowState === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-6 relative">
              <motion.div 
                animate={{ scale: isFocused ? 1.01 : 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                <div className={`absolute -inset-3 rounded-sm bg-primary/5 transition-opacity duration-600 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                <Input
                  type="email"
                  placeholder="your.name@university.edu"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  required
                  disabled={isLoading}
                  className="text-center relative bg-background/60 disabled:opacity-50"
                />
              </motion.div>

              {/* Domain warning */}
              {domainWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-sm p-4 text-center"
                >
                  <p className="text-sm text-foreground/80">
                    {domainWarning}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only students from partner universities can join at this time.
                  </p>
                </motion.div>
              )}

              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-destructive text-sm"
                >
                  {errorMessage}
                </motion.p>
              )}
              
              <div className="text-center">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading || !hasValidEmail}
                >
                  {isLoading ? "Sending..." : "Get Verification Code"}
                </Button>
              </div>

              <p className="text-center text-muted-foreground/50 text-xs font-light">
                We'll send a code to verify your email.
                <br />
                No spam. Ever.
              </p>
            </form>
          )}

          {/* OTP Verification Form */}
          {(flowState === "otp" || flowState === "verifying") && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 relative">
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
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-destructive text-sm"
                >
                  {errorMessage}
                </motion.p>
              )}
              
              <div className="text-center space-y-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading || otp.length !== 6 || flowState === "verifying"}
                >
                  {flowState === "verifying" ? "Logging in..." : isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                
                <div>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || flowState === "verifying"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Didn't receive a code? Resend
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => { setFlowState("email"); setOtp(""); setErrorMessage(""); }}
                  disabled={flowState === "verifying"}
                  className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  ← Use a different email
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Waitlist;
