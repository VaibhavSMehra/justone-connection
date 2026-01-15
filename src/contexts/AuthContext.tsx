import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  campus_id: string | null;
  verified: boolean;
  created_at: string;
}

type AppRole = "admin" | "student" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  userRole: AppRole;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  waitForAuth: () => Promise<{ user: User | null; profile: Profile | null }>;
  checkOnboardingStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<AppRole>(null);

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    return (data?.role as AppRole) ?? null;
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  }, []);

  const checkOnboardingStatus = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("responses")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking onboarding:", error);
      return false;
    }
    return !!data;
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    // Get current session to ensure we have the right user
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession?.user) {
      const profileData = await fetchProfile(currentSession.user.id);
      setProfile(profileData);
      
      // Also check onboarding status
      const completed = await checkOnboardingStatus(currentSession.user.id);
      setHasCompletedOnboarding(completed);
      
      // Fetch role
      const role = await fetchUserRole(currentSession.user.id);
      setUserRole(role);
      
      return profileData;
    }
    return null;
  }, [fetchProfile, checkOnboardingStatus, fetchUserRole]);

  // Wait for auth state to be fully ready - useful after setting session
  const waitForAuth = useCallback(async (): Promise<{ user: User | null; profile: Profile | null }> => {
    // Verify session is established
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.user) {
      return { user: null, profile: null };
    }

    // Update local state
    setSession(currentSession);
    setUser(currentSession.user);

    // Fetch and set profile
    const profileData = await fetchProfile(currentSession.user.id);
    setProfile(profileData);

    // Check onboarding status
    const completed = await checkOnboardingStatus(currentSession.user.id);
    setHasCompletedOnboarding(completed);

    // Fetch role
    const role = await fetchUserRole(currentSession.user.id);
    setUserRole(role);

    return { user: currentSession.user, profile: profileData };
  }, [fetchProfile, checkOnboardingStatus, fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            if (!mounted) return;
            
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
            
            // Check onboarding status
            const completed = await checkOnboardingStatus(currentSession.user.id);
            setHasCompletedOnboarding(completed);

            // Fetch role
            const role = await fetchUserRole(currentSession.user.id);
            setUserRole(role);
            
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setHasCompletedOnboarding(false);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const profileData = await fetchProfile(initialSession.user.id);
        if (mounted) {
          setProfile(profileData);
          
          const completed = await checkOnboardingStatus(initialSession.user.id);
          setHasCompletedOnboarding(completed);

          const role = await fetchUserRole(initialSession.user.id);
          setUserRole(role);
          
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkOnboardingStatus, fetchUserRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasCompletedOnboarding(false);
    setUserRole(null);
  }, []);

  const isAdmin = userRole === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        hasCompletedOnboarding,
        userRole,
        isAdmin,
        signOut,
        refreshProfile,
        waitForAuth,
        checkOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
