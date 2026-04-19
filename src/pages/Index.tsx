import { useEffect, useState } from "react";
import LoginView from "@/components/LoginView";
import Dashboard from "@/components/Dashboard";

interface AuthUser {
  mobile: string;
  name: string;
  isAdmin: boolean;
}

const STORAGE_KEY = "dunnes_auth_user";

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const handleLogin = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  if (!ready) return null;
  if (!user) return <LoginView onLogin={handleLogin} />;

  return (
    <Dashboard
      onLogout={handleLogout}
      userEmail={`${user.name} (${user.mobile})`}
      isAdmin={user.isAdmin}
      userMobile={user.mobile}
    />
  );
};

export default Index;
