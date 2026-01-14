import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">
          You're signed in as {profile?.email || user?.email}
        </p>
        <p className="text-sm text-muted-foreground">
          Your questionnaire has been submitted. We'll notify you when matching begins!
        </p>
        <Button onClick={handleSignOut} variant="outline" className="mt-4">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
