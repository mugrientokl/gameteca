import { ArrowUpRight, Gamepad2, Plus, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { imageUrl } from "../services/api";

export default function GameCard({ game, onAdd, adding }) {
  const { user } = useAuth();
  return (
    <article className="game-card">
      <Link className="game-art" to={`/juego/${game._id}`} aria-label={`Ver ${game.titulo}`}>
        {game.imagen
          ? <img className="game-cover" src={imageUrl(game.imagen)} alt={game.titulo} loading="lazy" />
          : <><div className="art-orbit" /><Gamepad2 size={42} strokeWidth={1.25} /></>}
        <span className="art-tag">{game.generos?.[0] || "Videojuego"}</span>
      </Link>
      <div className="game-card-content">
        <div className="game-card-heading">
          <div>
            <h3><Link to={`/juego/${game._id}`}>{game.titulo}</Link></h3>
            <p>{game.plataformas?.slice(0, 3).join(" · ") || "Plataformas no especificadas"}</p>
          </div>
          <Link className="card-arrow" to={`/juego/${game._id}`} aria-label="Ver detalle"><ArrowUpRight size={17} /></Link>
        </div>
        <div className="game-card-bottom">
          <div className="tag-list">
            {(game.generos || []).slice(0, 2).map((genre) => <span className="chip" key={genre}>{genre}</span>)}
            {game.promedio > 0 && <span className="chip chip-rating"><Star size={11} fill="currentColor" /> {game.promedio}</span>}
            {game.usuarios_biblioteca > 0 && <span className="chip"><Users size={11} /> {game.usuarios_biblioteca}</span>}
          </div>
          {user && onAdd && (
            <button
              className="icon-button add-game-button"
              onClick={() => onAdd(game)}
              disabled={adding}
              aria-label={`Agregar ${game.titulo} a mi biblioteca`}
              title="Agregar a mi biblioteca"
            >
              <Plus size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
