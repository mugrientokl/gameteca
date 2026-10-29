import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GameCard from "../components/GameCard";
import Notice from "../components/Notice";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "titulo", label: "Título (A-Z)" },
  { value: "puntuacion", label: "Mejor puntuados" },
  { value: "populares", label: "Más jugados (en bibliotecas)" },
  { value: "recientes", label: "Más recientes" },
  { value: "antiguos", label: "Más antiguos" }
];

export default function CatalogPage() {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("titulo");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState({ generos: [], plataformas: [] });
  const [result, setResult] = useState({ videojuegos: [], total: 0, paginas: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    api.gameFilters().then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.gamesPage({ ...filters, orden: sort, pagina: page, limite: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data?.videojuegos)) {
          throw new Error("Respuesta inesperada del servidor. Reinicia el backend para aplicar la última versión.");
        }
        setResult(data);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, sort, page]);

  const search = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ titulo: query.trim(), genero: genre, plataforma: platform });
  };

  const changeSort = (value) => {
    setSort(value);
    setPage(1);
  };

  const goTo = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <main className="page-shell catalog-section catalog-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DESCUBRE TU PRÓXIMA AVENTURA</span>
          <h2>Catálogo <span className="heading-count">{result.total}</span></h2>
        </div>
        <p>Filtra, ordena y encuentra el siguiente juego para tu colección.</p>
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
          {options.generos.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filtrar por plataforma">
          <option value="">Todas las plataformas</option>
          {options.plataformas.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => changeSort(event.target.value)} aria-label="Ordenar por">
          {SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="button button-primary filter-submit" type="submit">Buscar</button>
      </form>

      {notice && <Notice type="success" onClose={() => setNotice("")}>{notice}</Notice>}
      {error && <Notice type="error">{error}</Notice>}
      {loading ? (
        <div className="loading-state">Cargando juegos desde GameTeca…</div>
      ) : result.videojuegos.length ? (
        <>
          <div className="game-grid">
            {result.videojuegos.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                onAdd={user ? addGame : undefined}
                adding={addingId === game._id}
              />
            ))}
          </div>
          {result.paginas > 1 && (
            <nav className="pagination" aria-label="Paginación del catálogo">
              <button className="button button-secondary button-small" disabled={page <= 1} onClick={() => goTo(page - 1)}>
                <ChevronLeft size={15} /> Anterior
              </button>
              <span>Página <b>{result.pagina ?? page}</b> de {result.paginas}</span>
              <button className="button button-secondary button-small" disabled={page >= result.paginas} onClick={() => goTo(page + 1)}>
                Siguiente <ChevronRight size={15} />
              </button>
            </nav>
          )}
        </>
      ) : !error ? (
        <div className="empty-state">
          <span className="empty-icon"><Search size={24} /></span>
          <h3>No encontramos videojuegos</h3>
          <p>Prueba con otros filtros o vuelve a intentarlo más tarde.</p>
        </div>
      ) : null}
    </main>
  );
}
