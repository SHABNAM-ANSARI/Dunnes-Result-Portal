import { useState } from "react";
import DunnesHeader from "./DunnesHeader";
import { lookupUserByMobile } from "@/lib/auth";
import { toast } from "sonner";

interface LoginViewProps {
  onLogin: (user: { mobile: string; name: string; isAdmin: boolean }) => void;
}

const LoginView = ({ onLogin }: LoginViewProps) => {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    const trimmed = mobile.trim();
    if (!trimmed) {
      setError("Please enter your mobile number.");
      return;
    }
    setLoading(true);
    try {
      const user = await lookupUserByMobile(trimmed);
      if (!user) {
        setError("This mobile number is not registered. Access denied.");
        toast.error("Login blocked: number not found in database.");
        return;
      }
      toast.success(`Welcome ${user.name}${user.isAdmin ? " (Admin)" : ""}`);
      onLogin({ mobile: user.mobile, name: user.name, isAdmin: user.isAdmin });
    } catch (e) {
      console.error(e);
      setError("Could not verify right now. Please try again.");
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
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
            onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
            disabled={loading}
          />
          {error && (
            <p className="text-destructive text-sm font-semibold text-center">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & Enter"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Only mobile numbers registered in Lovable Cloud can log in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
