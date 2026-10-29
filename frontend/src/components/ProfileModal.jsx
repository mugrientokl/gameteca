import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Notice from "./Notice";

export default function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    nombre: user.nombre,
    passwordActual: "",
    passwordNueva: "",
    confirmar: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const changes = {};
    const nombre = form.nombre.trim();
    if (nombre !== user.nombre) changes.nombre = nombre;
    if (form.passwordNueva) {
      if (form.passwordNueva !== form.confirmar) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }
      changes.passwordActual = form.passwordActual;
      changes.passwordNueva = form.passwordNueva;
    }
    if (!Object.keys(changes).length) {
      setError("No hay cambios para guardar.");
      return;
    }

    setBusy(true);
    try {
      const result = await updateProfile(changes);
      setSuccess(result.mensaje);
      setForm((current) => ({ ...current, passwordActual: "", passwordNueva: "", confirmar: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal panel" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="modal-heading">
          <div><span className="eyebrow">MI CUENTA</span><h2 id="profile-title">Editar perfil</h2></div>
          <button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <Notice type="error">{error}</Notice>}
        {success && <Notice type="success">{success}</Notice>}
        <form className="form-stack" onSubmit={submit}>
          <label className="form-field"><span>Nombre de usuario</span>
            <input required minLength={2} maxLength={80} value={form.nombre} onChange={set("nombre")} />
          </label>
          <fieldset className="password-fieldset">
            <legend>Cambiar contraseña <small>opcional</small></legend>
            <label className="form-field"><span>Contraseña actual</span>
              <input type="password" autoComplete="current-password" value={form.passwordActual} onChange={set("passwordActual")} required={Boolean(form.passwordNueva)} />
            </label>
            <label className="form-field"><span>Nueva contraseña <small>12 a 72 caracteres</small></span>
              <input type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.passwordNueva} onChange={set("passwordNueva")} />
            </label>
            <label className="form-field"><span>Confirmar nueva contraseña</span>
              <input type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.confirmar} onChange={set("confirmar")} required={Boolean(form.passwordNueva)} />
            </label>
          </fieldset>
          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cerrar</button>
            <button className="button button-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
