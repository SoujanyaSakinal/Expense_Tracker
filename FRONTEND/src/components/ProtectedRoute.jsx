import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Admins are platform overseers, not regular users — send them
  // straight to the admin panel instead of personal expense pages.
  if (user?.is_admin) return <Navigate to="/admin" replace />;
  return children;
}