import { BookOpen, Gamepad2, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Notice from "../components/Notice";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const states = [
  ["pendiente", "Pendiente"],
  ["jugando", "Jugando"],
  ["completado", "Completado"]
];

export default function LibraryPage() {
  const { user, token } = useAuth();
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLibrary(await api.library(user.id, token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id, token]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  const updateState = async (gameId, estado) => {
    setBusyId(gameId);
    setNotice("");
    try {
      const result = await api.updateLibraryState(user.id, gameId, estado, token);
      setLibrary(result.biblioteca);
      setNotice("El progreso se actualizó.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId("");
    }
  };

  const removeGame = async (gameId, title) => {
    if (!window.confirm(`¿Quitar "${title}" de tu biblioteca?`)) return;
    setBusyId(gameId);
    setNotice("");
    try {
      const result = await api.removeFromLibrary(user.id, gameId, token);
      setLibrary(result.biblioteca);
      setNotice("El videojuego se quitó de tu biblioteca.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <main className="page-shell"><div className="loading-state">Cargando tu biblioteca…</div></main>;

  return (
    <main className="page-shell content-page">
      <section className="library-heading">
        <div>
          <span className="eyebrow">TU ESPACIO PERSONAL</span>
          <h1>Mi biblioteca</h1>
          <p>Hola, {user.nombre}. Lleva el ritmo de cada aventura.</p>
        </div>
        <div className="library-count"><BookOpen size={21} /><strong>{library?.juegos?.length || 0}</strong><span>juegos guardados</span></div>
      </section>

      {notice && <Notice type={notice.includes("actualizó") || notice.includes("quitó") ? "success" : "error"} onClose={() => setNotice("")}>{notice}</Notice>}
      {error && <Notice type="error">{error}</Notice>}

      {!library?.juegos?.length ? (
        <div className="empty-state library-empty">
          <span className="empty-icon"><Gamepad2 size={26} /></span>
          <h2>Tu biblioteca está esperando aventuras</h2>
          <p>Explora el catálogo y agrega tus próximos juegos.</p>
          <Link className="button button-primary" to="/catalogo"><Search size={16} /> Explorar catálogo</Link>
        </div>
      ) : (
        <div className="library-list">
          {library.juegos.map((entry) => {
            const game = entry.videojuegoId;
            const gameId = game?._id || entry.videojuegoId;
            const title = game?.titulo || "Videojuego no disponible";
            const inactive = game?.activo === false;
            return (
              <article className={`library-item panel ${inactive ? "is-inactive" : ""}`} key={String(gameId)}>
                <div className="library-game-icon"><Gamepad2 size={25} /></div>
                <div className="library-game-info">
                  {game?._id && !inactive ? <Link to={`/juego/${game._id}`}><h3>{title}</h3></Link> : <h3>{title}</h3>}
                  <p>{game?.plataformas?.join(" · ") || "Referencia conservada en el historial"}</p>
                  {inactive && <span className="inactive-badge">No disponible en el catálogo</span>}
                </div>
                <label className="progress-select">
                  <span>Progreso</span>
                  <select
                    value={entry.estado}
                    disabled={busyId === String(gameId)}
                    onChange={(event) => updateState(String(gameId), event.target.value)}
                  >
                    {states.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <button
                  className="icon-button remove-library-button"
                  title="Quitar de mi biblioteca"
                  aria-label={`Quitar ${title} de mi biblioteca`}
                  disabled={busyId === String(gameId)}
                  onClick={() => removeGame(String(gameId), title)}
                ><Trash2 size={17} /></button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
