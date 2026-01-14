import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  const handleClose = () => {
    // If opened via /privacy route, navigate back or to home
    if (location.pathname === "/privacy") {
      navigate(-1);
      // Fallback to home if there's no history
      setTimeout(() => {
        if (location.pathname === "/privacy") {
          navigate("/");
        }
      }, 100);
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-policy-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[900px] max-h-[90vh] bg-card border border-border rounded-sm shadow-2xl flex flex-col"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-border/40 bg-card">
              <h2
                id="privacy-policy-title"
                className="font-display text-xl md:text-2xl font-light text-foreground"
              >
                Privacy Policy
              </h2>
              <button
                onClick={handleClose}
                className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Close privacy policy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-6 md:px-8 py-6">
              <div className="prose prose-sm max-w-none text-foreground/90">
                {/* Last Updated */}
                <p className="text-xs text-muted-foreground mb-8">
                  Last updated: {today}
                </p>

                {/* Introduction */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Introduction
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Welcome to JustOne. We are committed to protecting your privacy and ensuring that your personal information is handled responsibly. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our matchmaking service.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                    By accessing or using JustOne, you agree to this Privacy Policy. If you do not agree with our policies and practices, please do not use our service.
                  </p>
                </section>

                {/* Data We Collect */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Data We Collect
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    We collect the following types of information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Account Information:</span> Your university email address, campus affiliation, and verification status.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Questionnaire Responses:</span> Your answers to our compatibility questionnaire, including preferences, interests, and values.
                    </li>
                  </ul>
                </section>

                {/* How We Use Data */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    How We Use Your Data
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    We use your information for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Matching:</span> To analyze your questionnaire responses and identify compatible matches within your campus.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Service Improvement:</span> To understand how users interact with our platform and improve our matching algorithms.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Security:</span> To protect against unauthorized access, fraud, and other harmful activities.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Communications:</span> To send you match notifications, service updates, and important announcements.
                    </li>
                  </ul>
                </section>

                {/* Legal Bases */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Legal Bases for Processing
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    We process your personal data based on:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Consent:</span> When you voluntarily provide your information and agree to this policy.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Contract:</span> To fulfill our service agreement with you when you use JustOne.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Legitimate Interests:</span> To improve our services and ensure platform security.
                    </li>
                  </ul>
                </section>

                {/* Data Sharing */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Data Sharing
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    We may share your information with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Service Providers:</span> Trusted third parties who assist us in operating our platform, such as hosting and email services.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Legal Compliance:</span> When required by law, court order, or governmental authority.
                    </li>
                  </ul>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-3 font-medium">
                    We do not sell your personal data to third parties.
                  </p>
                </section>

                {/* Data Retention */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Data Retention
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We retain your personal data only for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Questionnaire responses are retained for the duration of your participation in the matching cycle. After a cycle ends, data may be anonymized for analytical purposes or deleted upon request.
                  </p>
                </section>

                {/* Security Measures */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Security Measures
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    We implement robust security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Encryption:</span> All data is encrypted at rest and in transit using industry-standard protocols.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Access Controls:</span> Strict access controls ensure only authorized personnel can access personal data.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Regular Audits:</span> We conduct regular security assessments to identify and address vulnerabilities.
                    </li>
                  </ul>
                </section>

                {/* User Rights */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Your Rights
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    You have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground/80">Access:</span> Request a copy of the personal data we hold about you.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Correction:</span> Request correction of inaccurate or incomplete data.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Deletion:</span> Request deletion of your personal data, subject to legal obligations.
                    </li>
                    <li>
                      <span className="font-medium text-foreground/80">Withdrawal of Consent:</span> Withdraw your consent at any time by contacting us.
                    </li>
                  </ul>
                </section>

                {/* Cookies and Analytics */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Cookies and Analytics
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We use essential cookies to maintain your session and preferences. We may also use analytics tools to understand how users interact with our platform. These tools collect anonymized data and do not track you across other websites.
                  </p>
                </section>

                {/* International Transfers */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    International Data Transfers
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your data may be transferred to and processed in countries other than your own. We ensure that appropriate safeguards are in place to protect your data in accordance with applicable laws.
                  </p>
                </section>

                {/* Children/Minors */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Age Requirement
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    JustOne is intended for users who are 18 years of age or older. We do not knowingly collect personal data from individuals under 18. If we become aware that we have collected data from a minor, we will take steps to delete such information promptly.
                  </p>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Contact Us
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    support@justonematch.in
                  </p>
                </section>

                {/* Updates */}
                <section className="mb-4">
                  <h3 className="font-display text-lg font-medium text-foreground mb-3">
                    Updates to This Policy
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We may update this Privacy Policy from time to time. When we make changes, we will update the "Last updated" date at the top of this policy. We encourage you to review this policy periodically to stay informed about how we are protecting your information.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyPolicyModal;
