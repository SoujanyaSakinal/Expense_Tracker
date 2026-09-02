import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ledger_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ledger_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Write to localStorage immediately/synchronously — not via useEffect —
  // so the token is available right away to any API call that fires
  // as soon as the next page mounts (avoids a race condition).
  const login = (newToken, newUser) => {
    localStorage.setItem("ledger_token", newToken);
    localStorage.setItem("ledger_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("ledger_token");
    localStorage.removeItem("ledger_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}