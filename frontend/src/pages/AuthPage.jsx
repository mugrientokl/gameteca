import { ArrowLeft, Gamepad2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Notice from "../components/Notice";

export default function AuthPage({ mode }) {
  const registering = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ nombre: "", correo: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (registering) await register(form);
      else await login({ correo: form.correo, password: form.password });
      navigate(location.state?.from || "/biblioteca", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page page-shell">
      <div className="auth-decoration">
        <div className="auth-orb"><Gamepad2 size={58} strokeWidth={1.2} /></div>
        <span className="auth-orbit-label">PLAY · COLLECT · SHARE</span>
      </div>
      <section className="auth-card">
        <Link className="back-link" to="/inicio"><ArrowLeft size={16} /> Volver al catálogo</Link>
        <span className="eyebrow">{registering ? "EMPIEZA TU AVENTURA" : "QUÉ BUENO VERTE"}</span>
        <h1>{registering ? "Crea tu cuenta" : "Bienvenido de vuelta"}</h1>
        <p className="auth-subtitle">{registering
          ? "Guarda tus juegos y sigue cada paso de tu progreso."
          : "Inicia sesión para continuar donde lo dejaste."}</p>
        {error && <Notice type="error">{error}</Notice>}
        <form className="form-stack" onSubmit={submit}>
          {registering && (
            <label className="form-field">
              <span>Nombre</span>
              <div className="input-with-icon"><UserRound size={17} />
                <input
                  required minLength={2} maxLength={80} autoComplete="name"
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                  placeholder="Tu nombre"
                />
              </div>
            </label>
          )}
          <label className="form-field">
            <span>Correo electrónico</span>
            <input
              required type="email" maxLength={254} autoComplete="email"
              value={form.correo}
              onChange={(event) => setForm({ ...form, correo: event.target.value })}
              placeholder="nombre@correo.com"
            />
          </label>
          <label className="form-field">
            <span>Contraseña</span>
            <div className="input-with-icon"><LockKeyhole size={17} />
              <input
                required type="password" minLength={registering ? 12 : 1}
                maxLength={registering ? 72 : undefined}
                autoComplete={registering ? "new-password" : "current-password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={registering ? "Mínimo 12 caracteres" : "Tu contraseña"}
              />
            </div>
            {registering && <small>Usa entre 12 y 72 caracteres. La cuenta se crea como jugador.</small>}
          </label>
          <button className="button button-primary button-wide" disabled={busy}>
            {busy ? "Procesando…" : registering ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>
        <p className="auth-switch">
          {registering ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <Link to={registering ? "/ingresar" : "/registro"}>
            {registering ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </section>
    </main>
  );
}
