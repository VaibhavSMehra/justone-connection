import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "./Logo";
import CampusSelector from "./CampusSelector";
import { motion, useScroll, useTransform } from "framer-motion";
import heroCampusImage from "@/assets/hero-campus.jpg";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useCampus } from "@/contexts/CampusContext";
import { usePostAuthRedirect } from "@/hooks/usePostAuthRedirect";

// Admin email allowlist
const ADMIN_EMAILS = [
  "vaibhavmehra2027@u.northwestern.edu",
  "antonyvincent2026@u.northwestern.edu"
];

// Check if email is in admin allowlist
const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// Get allowed domains from campus context
const isAllowedDomain = (email: string, allowedDomains: string[]): boolean => {
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;
  return allowedDomains.some(d => domain === d || domain.endsWith(`.${d}`));
};

type FlowState = "email" | "otp" | "verifying";
type LoadingState = "idle" | "loading";

const Hero = () => {
  const { selectedCampus, getCampusDisplayName } = useCampus();
  const { redirectAfterAuth } = usePostAuthRedirect();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("email");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const maxResendAttempts = 3;

  // Get all allowed domains from all campuses for validation
  const allAllowedDomains = selectedCampus.domains;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const normalizedEmail = email.toLowerCase().trim();

    // Admin mode validation
    if (isAdminMode) {
      if (!isAdminEmail(normalizedEmail)) {
        setErrorMessage("Admin access only.");
        return;
      }
    } else {
      // Student mode validation - check campus domains
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
        // Check for rate limiting from error message
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

      // Handle error responses - when edge function returns non-2xx, error is set and data contains the response body
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
        // Set session and wait for auth state to propagate before navigating
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
        
        // Use deterministic routing - waits for auth state and routes appropriately
        const success = await redirectAfterAuth();
        
        if (!success) {
          // Retry once after a short delay if first attempt fails
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
        // Check for rate limiting from error message
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
    <section id="hero-signin" ref={sectionRef} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Cinematic campus background with couple stargazing - parallax effect */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ 
          backgroundImage: `url(${heroCampusImage})`,
          y: backgroundY
        }}
      />
      
      {/* Subtle breathing glow in the sky - barely perceptible */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/[0.03] to-primary/[0.08]"
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Animated starfield - very subtle twinkling */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-background/40 rounded-full"
            style={{
              left: `${8 + Math.random() * 84}%`,
              top: `${3 + Math.random() * 35}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 12,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Shooting stars - realistic and subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`shooting-${i}`}
            className="absolute"
            style={{
              left: `${5 + i * 40}%`,
              top: `${8 + i * 12}%`,
            }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.6, 0],
              x: [0, 120, 240],
              y: [0, 60, 120],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: 12 + i * 18,
              repeatDelay: 25 + i * 15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            {/* Star head - small bright point */}
            <div 
              className="w-1 h-1 rounded-full bg-white/90"
              style={{
                boxShadow: '0 0 4px 1px rgba(255,255,255,0.6), 0 0 8px 2px rgba(255,255,255,0.3)',
              }}
            />
            {/* Long fading tail */}
            <div 
              className="absolute top-1/2 right-full h-px origin-right"
              style={{
                width: '80px',
                background: 'linear-gradient(to left, rgba(255,255,255,0.5), rgba(255,255,255,0.2) 30%, transparent)',
                transform: 'translateY(-50%) rotate(-27deg)',
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Warm gradient overlay - reduced opacity to show couple */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/50" />
      
      {/* Paper grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Frosted vellum content container - centered */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="backdrop-blur-xl bg-background/65 border border-border/40 rounded-sm px-8 py-12 md:px-14 md:py-16 shadow-2xl shadow-foreground/5 max-w-2xl w-full"
        >
          {/* Subtle inner warmth */}
          <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          
          {/* Logo - now hero size */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 relative flex justify-center"
          >
            <Logo size="hero" />
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-light text-2xl md:text-4xl lg:text-5xl mb-2 text-balance leading-tight relative whitespace-nowrap"
          >
            <span className="italic text-primary">One Match.</span>{" "}
            <span className="text-foreground tracking-wide">No Swipes.</span>
          </motion.h1>
          
          {/* Campus name - smaller, bolder, different font */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans font-semibold text-sm md:text-base tracking-widest uppercase text-foreground/80 mb-6 relative"
          >
            At {selectedCampus.name}
          </motion.p>

          {/* Subtext */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground text-base md:text-lg font-medium leading-relaxed mb-4 max-w-xl mx-auto relative"
          >
            Tell us who you are, and what you're actually looking for.
            Each cycle, we introduce you to one carefully chosen person from {selectedCampus.name}.
          </motion.p>

          {/* Valentine's Day reveal mention */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm font-medium mb-8 relative"
          >
            Matches revealed before Valentine's Day
          </motion.p>

          {/* Email input / OTP form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-auto"
          >
            {flowState === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <motion.div 
                  animate={{ scale: isFocused ? 1.01 : 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative"
                >
                  <div className={`absolute -inset-3 rounded-sm bg-primary/5 transition-opacity duration-600 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                  <Input
                    type="email"
                    placeholder="your.name@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required
                    disabled={isLoading}
                    className="text-center relative bg-background/60 disabled:opacity-50"
                  />
                </motion.div>

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
                  {isLoading ? "Sending..." : isAdminMode ? "Admin Sign In" : "Get Matched"}
                </Button>

                <p className="text-center text-muted-foreground/60 text-xs font-medium">
                  {isAdminMode 
                    ? "Admin access restricted to authorized emails only"
                    : "Enter your campus email to get started"
                  }
                </p>

                {/* Admin mode toggle */}
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
                  <div className="text-center space-y-2">
                    <p className="text-destructive text-sm">{errorMessage}</p>
                    {resendCount < maxResendAttempts && (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isResending || flowState === "verifying"}
                        className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors disabled:opacity-50"
                      >
                        {isResending ? "Sending..." : `Resend code (${maxResendAttempts - resendCount} left)`}
                      </button>
                    )}
                    {resendCount >= maxResendAttempts && (
                      <p className="text-muted-foreground text-xs">
                        Maximum resend attempts reached. Please try again later.
                      </p>
                    )}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading || otp.length !== 6 || flowState === "verifying"}
                  className="w-full"
                >
                  {flowState === "verifying" ? "Verifying..." : "Verify & Continue"}
                </Button>
                
                <button
                  type="button"
                  onClick={() => { setFlowState("email"); setOtp(""); setErrorMessage(""); setResendCount(0); }}
                  disabled={flowState === "verifying"}
                  className="w-full text-sm text-muted-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  ← Use a different email
                </button>
              </form>
            )}
          </motion.div>

          {/* Campus Selector - below form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 relative flex justify-center"
          >
            <CampusSelector />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator - subtle breathing line */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          animate={{ scaleY: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-primary/30 to-transparent origin-top" 
        />
      </motion.div>
    </section>
  );
};

export default Hero;
