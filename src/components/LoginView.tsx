import { useState } from "react";
import DunnesHeader from "./DunnesHeader";
import { findUserByMobile, isAdminMobile } from "@/lib/auth";
import { toast } from "sonner";

interface LoginViewProps {
  onLogin: (user: { mobile: string; name: string; isAdmin: boolean }) => void;
}

const LoginView = ({ onLogin }: LoginViewProps) => {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const trimmed = mobile.trim();
    if (!trimmed) {
      setError("Please enter your mobile number.");
      return;
    }
    const user = findUserByMobile(trimmed);
    if (!user) {
      setError("This mobile number is not registered. Access denied.");
      toast.error("Login blocked: number not found in teacher database.");
      return;
    }
    const admin = isAdminMobile(trimmed);
    toast.success(`Welcome ${user.name}${admin ? " (Admin)" : ""}`);
    onLogin({ mobile: trimmed, name: user.name, isAdmin: admin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5">
      <div className="bg-card p-10 rounded-2xl shadow-2xl w-[420px] border-t-8 border-primary">
        <DunnesHeader />
        <div className="space-y-4">
          <p className="text-center font-bold text-muted-foreground text-sm">TEACHER PORTAL LOGIN</p>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Registered Mobile Number"
            className="input-field"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && (
            <p className="text-destructive text-sm font-semibold text-center">{error}</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition"
          >
            Verify & Enter
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Only mobile numbers registered in the teacher database can log in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
