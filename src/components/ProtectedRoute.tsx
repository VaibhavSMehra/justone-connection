import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-light text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Must be authenticated
  if (!user) {
    return <Navigate to="/verify" replace />;
  }

  // Must have a verified profile with campus_id
  if (!profile || !profile.verified || !profile.campus_id) {
    return <Navigate to="/verify" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
