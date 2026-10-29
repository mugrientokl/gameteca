import { ArchiveRestore, Edit3, Plus, Shield, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import GameCard from "../components/GameCard";
import Notice from "../components/Notice";
import { useAuth } from "../context/AuthContext";
import { api, imageUrl } from "../services/api";

const blankForm = {
  titulo: "",
  generos: "",
  plataformas: "",
  multijugador: false,
  online: false,
  rango_edad: ""
};

const toForm = (game) => ({
  titulo: game.titulo || "",
  generos: (game.generos || []).join(", "),
  plataformas: (game.plataformas || []).join(", "),
  multijugador: Boolean(game.caracteristicas?.multijugador),
  online: Boolean(game.caracteristicas?.online),
  rango_edad: game.caracteristicas?.rango_edad || ""
});

const toPayload = (form) => ({
  titulo: form.titulo.trim(),
  generos: form.generos.split(",").map((value) => value.trim()).filter(Boolean),
  plataformas: form.plataformas.split(",").map((value) => value.trim()).filter(Boolean),
  caracteristicas: {
    multijugador: form.multijugador,
    online: form.online,
    rango_edad: form.rango_edad.trim()
  }
});

export default function AdminPage() {
  const { token } = useAuth();
  const [activeGames, setActiveGames] = useState([]);
  const [inactiveGames, setInactiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("active");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [active, inactive] = await Promise.all([
        api.games(),
        api.inactiveGames(token)
      ]);
      setActiveGames(active);
      setInactiveGames(inactive);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const resetForm = () => {
    setForm(blankForm);
    setEditingId("");
    setImageFile(null);
    setCurrentImage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const payload = toPayload(form);
      if (!payload.generos.length || !payload.plataformas.length) {
        throw new Error("Indica al menos un género y una plataforma.");
      }
      if (editingId) {
        await api.updateGame(editingId, payload, token);
        if (imageFile) await api.uploadGameImage(editingId, imageFile, token);
        setNotice("El videojuego se actualizó correctamente.");
      } else {
        const created = await api.createGame(payload, token);
        if (imageFile) {
          try {
            await api.uploadGameImage(created.videojuego._id, imageFile, token);
          } catch (err) {
            resetForm();
            await refresh();
            throw new Error(`El videojuego se creó, pero la imagen no se pudo subir: ${err.message}`);
          }
        }
        setNotice("El videojuego se creó correctamente.");
      }
      resetForm();
      await refresh();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const editGame = (game) => {
    setForm(toForm(game));
    setEditingId(game._id);
    setImageFile(null);
    setCurrentImage(game.imagen || "");
    setTab(game.activo === false ? "inactive" : "active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deactivate = async (game) => {
    if (!window.confirm(`¿Desactivar "${game.titulo}"? Sus referencias históricas se conservarán.`)) return;
    setBusy(true);
    setNotice("");
    try {
      await api.deactivateGame(game._id, token);
      setNotice("El videojuego se desactivó y conserva su historial.");
      await refresh();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reactivate = async (game) => {
    setBusy(true);
    setNotice("");
    try {
      await api.reactivateGame(game._id, token);
      setNotice("El videojuego se reactivó correctamente.");
      await refresh();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const listedGames = tab === "active" ? activeGames : inactiveGames;

  return (
    <main className="page-shell content-page admin-page">
      <section className="admin-heading">
        <div><span className="eyebrow"><Shield size={14} /> ESPACIO DE ADMINISTRACIÓN</span><h1>Gestión de catálogo</h1><p>Administra el catálogo sin perder las referencias del historial.</p></div>
        <div className="admin-counts"><span><b>{activeGames.length}</b> activos</span><span><b>{inactiveGames.length}</b> inactivos</span></div>
      </section>

      {notice && <Notice type={notice.includes("correctamente") || notice.includes("conserva") ? "success" : "error"} onClose={() => setNotice("")}>{notice}</Notice>}
      {error && <Notice type="error">{error}</Notice>}

      <section className="admin-editor panel">
        <div className="admin-editor-heading">
          <div><span className="eyebrow">{editingId ? "ACTUALIZAR INFORMACIÓN" : "AMPLÍA LA COLECCIÓN"}</span><h2>{editingId ? "Editar videojuego" : "Añadir videojuego"}</h2></div>
          {editingId
            ? <button className="icon-button" aria-label="Cancelar edición" onClick={resetForm}><X size={18} /></button>
            : <span className="editor-icon"><Plus size={19} /></span>}
        </div>
        <form className="admin-form" onSubmit={submit}>
          <label className="form-field"><span>Título</span>
            <input required minLength={2} maxLength={150} value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} placeholder="Nombre del videojuego" />
          </label>
          <label className="form-field"><span>Géneros <small>separados por coma</small></span>
            <input required value={form.generos} onChange={(event) => setForm({ ...form, generos: event.target.value })} placeholder="Aventura, Acción" />
          </label>
          <label className="form-field"><span>Plataformas <small>separadas por coma</small></span>
            <input required value={form.plataformas} onChange={(event) => setForm({ ...form, plataformas: event.target.value })} placeholder="PC, PlayStation" />
          </label>
          <label className="form-field"><span>Rango de edad</span>
            <input value={form.rango_edad} onChange={(event) => setForm({ ...form, rango_edad: event.target.value })} placeholder="Ej. T / 13+" />
          </label>
          <label className="form-field"><span>Imagen <small>opcional · JPG, PNG o WEBP, máx. 2 MB</small></span>
            {currentImage && !imageFile && <img className="admin-image-preview" src={imageUrl(currentImage)} alt="Imagen actual" />}
            <input key={imageFile ? "has-file" : "no-file"} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          </label>
          <div className="admin-checks">
            <label className="check-field"><input type="checkbox" checked={form.multijugador} onChange={(event) => setForm({ ...form, multijugador: event.target.checked })} /> Multijugador</label>
            <label className="check-field"><input type="checkbox" checked={form.online} onChange={(event) => setForm({ ...form, online: event.target.checked })} /> Juego en línea</label>
          </div>
          <div className="admin-form-actions">
            <button className="button button-primary" disabled={busy}>{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Crear videojuego"}</button>
            {editingId && <button type="button" className="button button-secondary" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="admin-catalog">
        <div className="admin-tabs" role="tablist" aria-label="Catálogo administrativo">
          <button role="tab" aria-selected={tab === "active"} className={tab === "active" ? "selected" : ""} onClick={() => { setTab("active"); resetForm(); }}>Activos <span>{activeGames.length}</span></button>
          <button role="tab" aria-selected={tab === "inactive"} className={tab === "inactive" ? "selected" : ""} onClick={() => { setTab("inactive"); resetForm(); }}>Inactivos <span>{inactiveGames.length}</span></button>
        </div>
        {loading ? <div className="loading-state">Cargando catálogo administrativo…</div> : listedGames.length ? (
          <div className="admin-game-grid">
            {listedGames.map((game) => (
              <div className="admin-game-wrap" key={game._id}>
                <GameCard game={game} />
                <div className="admin-game-actions">
                  <button className="button button-secondary button-small" onClick={() => editGame(game)}><Edit3 size={14} /> Editar</button>
                  {tab === "active" ? (
                    <button className="button button-danger button-small" disabled={busy} onClick={() => deactivate(game)}><Trash2 size={14} /> Desactivar</button>
                  ) : (
                    <button className="button button-primary button-small" disabled={busy} onClick={() => reactivate(game)}><ArchiveRestore size={14} /> Reactivar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !error ? (
          <div className="empty-state compact-empty"><h3>{tab === "active" ? "El catálogo está vacío" : "No hay videojuegos inactivos"}</h3><p>{tab === "active" ? "Crea el primer videojuego con el formulario." : "Los videojuegos que desactives aparecerán aquí."}</p></div>
        ) : null}
      </section>
    </main>
  );
}
