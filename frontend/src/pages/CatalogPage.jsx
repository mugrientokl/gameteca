import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GameCard from "../components/GameCard";
import Notice from "../components/Notice";

export default function CatalogPage() {
  const { token, user } = useAuth();
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.games(filters)
      .then((result) => { if (active) setGames(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  const genres = useMemo(
    () => [...new Set(games.flatMap((game) => game.generos || []))].sort(),
    [games]
  );
  const platforms = useMemo(
    () => [...new Set(games.flatMap((game) => game.plataformas || []))].sort(),
    [games]
  );

  const search = (event) => {
    event.preventDefault();
    setFilters({ titulo: query.trim(), genero, plataforma: platform });
  };

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
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-content">
          <span className="eyebrow"><Sparkles size={14} /> TU UNIVERSO GAMER</span>
          <h1>Todos tus juegos,<br /><span>en un solo lugar.</span></h1>
          <p>Descubre videojuegos, lleva el seguimiento de tu aventura y comparte tu opinión con la comunidad.</p>
          <div className="hero-actions">
            <a href="#catalogo" className="button button-primary">Explorar catálogo <ArrowRight size={17} /></a>
            {user ? (
              <Link to="/biblioteca" className="button button-secondary">Mi biblioteca</Link>
            ) : (
              <Link to="/registro" className="button button-secondary">Únete a GameTeca</Link>
            )}
          </div>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <div className="hero-disc"><span><Sparkles size={45} /></span></div>
          <div className="hero-float hero-float-top">PLAY <b>YOUR</b> WAY</div>
          <div className="hero-float hero-float-bottom">LEVEL UP <span>✦</span></div>
        </div>
      </section>

      <section className="catalog-section page-shell" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DESCUBRE TU PRÓXIMA AVENTURA</span>
            <h2>Catálogo <span className="heading-count">{games.length}</span></h2>
          </div>
          <p>Filtra y encuentra el siguiente juego para tu colección.</p>
        </div>

        <form className="filter-bar" onSubmit={search}>
          <label className="search-field">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título…"
              maxLength={100}
              aria-label="Buscar por título"
            />
          </label>
          <select value={genre} onChange={(event) => setGenre(event.target.value)} aria-label="Filtrar por género">
            <option value="">Todos los géneros</option>
            {genres.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filtrar por plataforma">
            <option value="">Todas las plataformas</option>
            {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="button button-primary filter-submit" type="submit">Buscar</button>
        </form>

        {notice && <Notice type="success" onClose={() => setNotice("")}>{notice}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
        {loading ? (
          <div className="loading-state">Cargando juegos desde GameTeca…</div>
        ) : games.length ? (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                onAdd={user ? addGame : undefined}
                adding={addingId === game._id}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="empty-state">
            <span className="empty-icon"><Search size={24} /></span>
            <h3>No encontramos videojuegos</h3>
            <p>Prueba con otros filtros o vuelve a intentarlo más tarde.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
