import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import GamePage from "./pages/GamePage";
import LibraryPage from "./pages/LibraryPage";

function Landing() {
  const { user } = useAuth();
  return <Navigate to={user ? "/catalogo" : "/inicio"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/inicio" element={<CatalogPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/juego/:id" element={<GamePage />} />
        <Route path="/ingresar" element={<AuthPage mode="login" />} />
        <Route path="/registro" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/biblioteca" element={<LibraryPage />} />
        </Route>
        <Route element={<ProtectedRoute admin />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<main className="page-shell"><h1>Página no encontrada</h1></main>} />
      </Route>
    </Routes>
  );
}
