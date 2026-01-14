import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that provides deterministic post-auth routing.
 * After successful authentication, routes user to:
 * - /questionnaire if they haven't completed onboarding
 * - / (home) if they have completed onboarding (can be changed to /app later)
 */
export const usePostAuthRedirect = () => {
  const navigate = useNavigate();
  const { waitForAuth, checkOnboardingStatus } = useAuth();

  /**
   * Establishes session, verifies auth state, and redirects to appropriate page.
   * Returns true if redirect succeeded, false if auth verification failed.
   */
  const redirectAfterAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Wait for auth state to be fully established
      const { user, profile } = await waitForAuth();
      
      if (!user) {
        console.error("No user after waitForAuth");
        return false;
      }

      if (!profile || !profile.verified || !profile.campus_id) {
        console.error("Profile not ready:", { profile });
        return false;
      }

      // Check if user has completed onboarding (submitted questionnaire)
      const hasCompleted = await checkOnboardingStatus(user.id);

      if (hasCompleted) {
        // User has completed questionnaire - go to dashboard
        navigate("/app", { replace: true });
      } else {
        // User needs to complete questionnaire
        navigate("/questionnaire", { replace: true });
      }

      return true;
    } catch (error) {
      console.error("Error in redirectAfterAuth:", error);
      return false;
    }
  }, [navigate, waitForAuth, checkOnboardingStatus]);

  return { redirectAfterAuth };
};
