import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import * as api from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
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
          <p className="text-sm text-ink-soft">Reset your password</p>
        </div>

        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-8 px-6 pb-6">
          {submitted ? (
            <p className="text-sm text-ink-soft text-center">
              If an account with that email exists, a reset link has been sent.
              Check your inbox (and spam folder).
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald text-paper-card rounded-md py-2.5 text-sm font-medium hover:bg-emerald-dark transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ink-soft mt-5">
          <Link to="/login" className="text-emerald font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}