import { ArrowRight, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GameCard from "../components/GameCard";
import Notice from "../components/Notice";

export default function HomePage() {
  const { token, user } = useAuth();
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    let active = true;
    api.topGames()
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result)) {
          throw new Error("Respuesta inesperada del servidor. Reinicia el backend para aplicar la última versión.");
        }
        setTop(result);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const addGame = async (game) => {
    setAddingId(game._id);
    setNotice("");
    try {
      await api.addToLibrary(user.id, game._id, token);
      setNotice(`${game.titulo} se agregó a tu biblioteca.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setAddingId("");
    }
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow"><Sparkles size={14} /> TU UNIVERSO GAMER</span>
          <h1>Todos tus juegos,<br /><span>en un solo lugar.</span></h1>
          <p>Descubre videojuegos, lleva el seguimiento de tu aventura y comparte tu opinión con la comunidad.</p>
          <div className="hero-actions">
            <Link to="/catalogo" className="button button-primary">Explorar catálogo <ArrowRight size={17} /></Link>
            {user ? (
              <Link to="/biblioteca" className="button button-secondary">Mi biblioteca</Link>
            ) : (
              <Link to="/registro" className="button button-secondary">Únete a GameTeca</Link>
            )}
          </div>
        </div>
      </section>

      <section className="catalog-section page-shell" id="top">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><Trophy size={14} /> LO MEJOR DE LA COMUNIDAD</span>
            <h2>Top 10 mejor valorados</h2>
          </div>
          <p><Link className="text-link" to="/catalogo">Ver todo el catálogo <ArrowRight size={13} /></Link></p>
        </div>

        {notice && <Notice type="success" onClose={() => setNotice("")}>{notice}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
        {loading ? (
          <div className="loading-state">Cargando ranking…</div>
        ) : top.length ? (
          <div className="game-grid">
            {top.map((game, index) => (
              <div className="ranked-wrap" key={game._id}>
                <span className="rank-badge">#{index + 1}</span>
                <GameCard
                  game={game}
                  onAdd={user ? addGame : undefined}
                  adding={addingId === game._id}
                />
              </div>
            ))}
          </div>
        ) : !error ? (
          <div className="empty-state">
            <span className="empty-icon"><Star size={24} /></span>
            <h3>Aún no hay juegos valorados</h3>
            <p>Cuando la comunidad publique reseñas, los mejores juegos aparecerán aquí.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
