import { Gamepad2, LogOut, Menu, Shield, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);
  const exit = () => {
    logout();
    closeMenu();
    navigate("/inicio");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/inicio" onClick={closeMenu}>
            <span className="brand-mark"><Gamepad2 size={21} /></span>
            <span>Game<span className="brand-accent">Teca</span></span>
          </Link>
          <button
            className="icon-button mobile-menu-button"
            aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
            <NavLink to="/inicio" onClick={closeMenu}>Explorar</NavLink>
            {user && <NavLink to="/biblioteca" onClick={closeMenu}>Mi biblioteca</NavLink>}
            {user?.rol === "admin" && (
              <NavLink className="admin-nav-link" to="/admin" onClick={closeMenu}>
                <Shield size={15} /> Administración
              </NavLink>
            )}
            <div className="nav-account">
              {user ? (
                <>
                  <span className="account-name"><UserRound size={15} /> {user.nombre}</span>
                  <button className="button button-ghost button-small" onClick={exit}>
                    <LogOut size={15} /> Salir
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/ingresar" onClick={closeMenu}>Ingresar</NavLink>
                  <Link className="button button-primary button-small" to="/registro" onClick={closeMenu}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/inicio"><Gamepad2 size={18} /> GameTeca</Link>
        <span>Tu colección, tu progreso, tu comunidad.</span>
      </footer>
    </div>
  );
}
