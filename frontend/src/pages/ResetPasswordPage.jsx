import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Notice from "../components/Notice";
import { api } from "../services/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page page-shell auth-single">
      <section className="auth-card">
        <Link className="back-link" to="/ingresar"><ArrowLeft size={16} /> Ir a iniciar sesión</Link>
        <span className="eyebrow">NUEVA CONTRASEÑA</span>
        <h1>Restablece tu contraseña</h1>
        {!token && <Notice type="error">El enlace no es válido. Solicita uno nuevo.</Notice>}
        {error && <Notice type="error">{error}</Notice>}
        {done ? (
          <>
            <Notice type="success">Contraseña restablecida correctamente.</Notice>
            <Link className="button button-primary button-wide" to="/ingresar">Iniciar sesión</Link>
          </>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            <label className="form-field">
              <span>Nueva contraseña</span>
              <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 12 caracteres" />
            </label>
            <label className="form-field">
              <span>Confirmar contraseña</span>
              <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </label>
            <button className="button button-primary button-wide" disabled={busy || !token}>{busy ? "Guardando…" : "Guardar contraseña"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
