import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, admin }) {
  const { user } = useAuth();

  // User not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin protected route
  if (admin && !user.isAdmin) {
    return <Navigate to="/centers" replace />;
  }

  return children;
}
