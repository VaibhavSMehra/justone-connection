import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, loading, hasCompletedOnboarding, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const focusHeroSignin = () => {
    const heroSection = document.getElementById("hero-signin");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Focus the actual email input so it feels like a real "open sign-in" action
    window.setTimeout(() => {
      const input = document.getElementById("hero-email-input") as HTMLInputElement | null;
      input?.focus();
    }, 250);
  };

  const handleSignInClick = () => {
    if (user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (hasCompletedOnboarding) {
        navigate("/app");
      } else {
        navigate("/questionnaire");
      }
      return;
    }

    // Not signed in → open the same sign-in flow on the home hero
    if (window.location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => focusHeroSignin(), 150);
    } else {
      focusHeroSignin();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
        scrolled ? "bg-card/80 backdrop-blur-md border-b border-border/30" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo />
        </motion.div>

        {/* Right side nav */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-6"
        >
          <button
            onClick={() => navigate("/about")}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
          >
            About
          </button>

          <button
            onClick={() => navigate("/faqs")}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
          >
            FAQs
          </button>

          {/* Sign In / Continue button */}
          {!loading && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={handleSignInClick}
            >
              {user ? "Continue" : "Sign In"}
            </Button>
          )}
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
