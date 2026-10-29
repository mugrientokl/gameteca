import { ChevronDown, Gamepad2, LogOut, Menu, Settings, Shield, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const onKey = (event) => { if (event.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const exit = () => {
    logout();
    setUserMenuOpen(false);
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
            <NavLink to="/inicio" onClick={closeMenu}>Inicio</NavLink>
            <NavLink to="/catalogo" onClick={closeMenu}>Catálogo</NavLink>
            {user && <NavLink to="/biblioteca" onClick={closeMenu}>Mi biblioteca</NavLink>}
            {user?.rol === "admin" && (
              <NavLink className="admin-nav-link" to="/admin" onClick={closeMenu}>
                <Shield size={15} /> Administración
              </NavLink>
            )}
            <div className="nav-account">
              {user ? (
                <div className="user-menu" ref={userMenuRef}>
                  <button
                    className="button button-ghost button-small user-menu-button"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <UserRound size={15} /> <span className="user-menu-name">{user.nombre}</span> <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className="user-menu-list" role="menu">
                      <button role="menuitem" onClick={() => { setProfileOpen(true); setUserMenuOpen(false); closeMenu(); }}>
                        <Settings size={15} /> Editar perfil
                      </button>
                      <button role="menuitem" onClick={exit}>
                        <LogOut size={15} /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
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
      {profileOpen && user && <ProfileModal onClose={() => setProfileOpen(false)} />}
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/inicio"><Gamepad2 size={18} /> GameTeca</Link>
        <span>Tu colección, tu progreso, tu comunidad.</span>
      </footer>
    </div>
  );
}
