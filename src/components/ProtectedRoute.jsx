import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-state">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some((role) => user.roles?.includes(role))) return <Navigate to="/dashboard" replace />;
  return children;
}

export default ProtectedRoute;
