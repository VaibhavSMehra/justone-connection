import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Shield } from "lucide-react";

const AdminPage = () => {
  const { user, profile, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate("/");
        return;
      }
      if (userRole !== "admin") {
        navigate("/");
        return;
      }
    }
  }, [user, profile, userRole, loading, navigate]);

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

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                Signed in as {profile?.email}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="p-6 rounded-lg bg-card border border-border/30">
              <h2 className="font-medium text-foreground mb-2">Welcome, Admin</h2>
              <p className="text-muted-foreground text-sm">
                This is the admin dashboard. You have elevated access to manage the platform.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border/30">
              <h3 className="font-medium text-foreground mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded bg-background/50">
                  <p className="text-2xl font-semibold text-primary">—</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-4 rounded bg-background/50">
                  <p className="text-2xl font-semibold text-primary">—</p>
                  <p className="text-xs text-muted-foreground">Responses</p>
                </div>
                <div className="text-center p-4 rounded bg-background/50">
                  <p className="text-2xl font-semibold text-primary">—</p>
                  <p className="text-xs text-muted-foreground">Campuses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
