import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import * as api from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
     if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await api.login(email.trim().toLowerCase(), password);
      login(token, user);
      navigate(user.is_admin ? "/admin" : "/");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <BookOpen size={32} className="text-emerald mb-2" strokeWidth={1.75} />
          <h1 className="font-display text-2xl text-ink">Ledger</h1>
          <p className="text-sm text-ink-soft">Welcome back</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="perforated-top bg-paper-card border border-line rounded-lg pt-8 px-6 pb-6 space-y-4"
        >
          {error && (
            <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-line rounded-md px-3 py-2 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs uppercase tracking-wide text-ink-soft">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-emerald hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper border border-line rounded-md px-3 py-2 pr-10 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald text-paper-card rounded-md py-2.5 text-sm font-medium hover:bg-emerald-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-emerald font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}