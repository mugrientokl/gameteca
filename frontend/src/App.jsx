import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import HomePage from "./pages/HomePage";
import RecoverPage from "./pages/RecoverPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GamePage from "./pages/GamePage";
import LibraryPage from "./pages/LibraryPage";

function Landing() {
  return <Navigate to="/inicio" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/juego/:id" element={<GamePage />} />
        <Route path="/ingresar" element={<AuthPage mode="login" />} />
        <Route path="/registro" element={<AuthPage mode="register" />} />
        <Route path="/recuperar" element={<RecoverPage />} />
        <Route path="/restablecer" element={<ResetPasswordPage />} />
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
