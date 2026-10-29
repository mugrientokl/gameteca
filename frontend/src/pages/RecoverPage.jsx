import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Notice from "../components/Notice";
import { api } from "../services/api";

export default function RecoverPage() {
  const [correo, setCorreo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api.forgotPassword(correo.trim());
      setMessage(result.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page page-shell auth-single">
      <section className="auth-card">
        <Link className="back-link" to="/ingresar"><ArrowLeft size={16} /> Volver a iniciar sesión</Link>
        <span className="eyebrow">RECUPERAR ACCESO</span>
        <h1>¿Olvidaste tu contraseña?</h1>
        <p className="auth-subtitle">Indica tu correo y te enviaremos un enlace para crear una contraseña nueva. El enlace es válido durante 1 hora.</p>
        {message && <Notice type="success">{message}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
        <form className="form-stack" onSubmit={submit}>
          <label className="form-field">
            <span>Correo electrónico</span>
            <input required type="email" maxLength={254} autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} placeholder="nombre@correo.com" />
          </label>
          <button className="button button-primary button-wide" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</button>
        </form>
      </section>
    </main>
  );
}
