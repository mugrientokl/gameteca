import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="page-shell"><div className="loading-state">Verificando sesión…</div></main>;
  }
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  if (admin && user.rol !== "admin") return <Navigate to="/inicio" replace />;
  return <Outlet />;
}
