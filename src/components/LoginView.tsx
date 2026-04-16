import { useState } from "react";
import DunnesHeader from "./DunnesHeader";

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView = ({ onLogin }: LoginViewProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5">
      <div className="bg-card p-10 rounded-2xl shadow-2xl w-[420px] border-t-8 border-primary">
        <DunnesHeader />
        <div className="space-y-4">
          <p className="text-center font-bold text-muted-foreground text-sm">TEACHER DATABASE LOGIN</p>
          <input
            type="email"
            placeholder="Teacher Email ID"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Secure Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={onLogin}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition"
          >
            Verify & Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
