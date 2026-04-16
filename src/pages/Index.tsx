import { useState } from "react";
import LoginView from "@/components/LoginView";
import Dashboard from "@/components/Dashboard";
import { isAdmin } from "@/lib/auth";

const Index = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  if (!userEmail) {
    return <LoginView onLogin={(email) => setUserEmail(email)} />;
  }

  return (
    <Dashboard
      onLogout={() => setUserEmail(null)}
      userEmail={userEmail}
      isAdmin={isAdmin(userEmail)}
    />
  );
};

export default Index;
