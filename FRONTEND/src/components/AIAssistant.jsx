import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import * as api from "../lib/api";

const SUGGESTED_QUESTIONS = [
  "What category do I spend the most on?",
  "How much did I spend last month?",
  "Any unusual transactions?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest"     });
  }, [messages, loading]);

  const sendQuestion = async (question) => {
    if (!question.trim() || loading) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const { answer } = await api.askAI(question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5 flex flex-col h-[500px]">
      <h2 className="font-display text-lg mb-1 text-ink flex items-center gap-2">
        <Sparkles size={18} className="text-emerald" />
        Ask your ledger
      </h2>
      <p className="text-xs text-ink-soft mb-4">
        Ask a plain-English question about your spending.
      </p>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-ink-soft mb-2">Try asking:</p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                className="block w-full text-left text-sm text-emerald border border-emerald/30 rounded-md px-3 py-2 hover:bg-emerald/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-emerald text-paper-card"
                  : "bg-paper border border-line text-ink"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-paper border border-line rounded-lg px-4 py-2.5 text-sm text-ink-soft flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{error}</p>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending…"
          disabled={loading}
          className="flex-1 bg-paper border border-line rounded-md px-3 py-2 text-sm focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-emerald text-paper-card rounded-md px-3 hover:bg-emerald-dark disabled:opacity-40 transition-colors"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}