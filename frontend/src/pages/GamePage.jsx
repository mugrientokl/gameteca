import { ArrowLeft, Gamepad2, Plus, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Notice from "../components/Notice";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const emptyForm = { puntuacion: "5", comentario: "" };

export default function GamePage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [game, setGame] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gameResult, reviewsResult] = await Promise.all([
        api.game(id),
        api.reviews(id)
      ]);
      setGame(gameResult);
      setReviewData(reviewsResult);
      const ownReview = user
        ? reviewsResult.resenas.find((review) => {
          const authorId = review.usuarioId?._id || review.usuarioId;
          return String(authorId) === String(user.id);
        })
        : null;
      setMyReview(ownReview || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const review = {
        puntuacion: Number(form.puntuacion),
        comentario: form.comentario.trim()
      };
      if (editing && myReview) {
        await api.updateReview(myReview._id, review, token);
        setNotice("Tu reseña se actualizó correctamente.");
      } else {
        await api.createReview({ videojuegoId: id, ...review }, token);
        setNotice("Tu reseña se publicó correctamente.");
      }
      setEditing(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const editReview = () => {
    setForm({
      puntuacion: String(myReview.puntuacion),
      comentario: myReview.comentario
    });
    setEditing(true);
  };

  const deleteReview = async () => {
    if (!myReview || !window.confirm("¿Quieres eliminar tu reseña?")) return;
    setBusy(true);
    setNotice("");
    try {
      await api.deleteReview(myReview._id, token);
      setNotice("Tu reseña se eliminó correctamente.");
      setMyReview(null);
      setEditing(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addToLibrary = async () => {
    setBusy(true);
    setNotice("");
    try {
      await api.addToLibrary(user.id, game._id, token);
      setNotice("El videojuego se agregó a tu biblioteca.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="page-shell"><div className="loading-state">Cargando videojuego…</div></main>;
  if (error) return (
    <main className="page-shell content-page">
      <Link className="back-link" to="/inicio"><ArrowLeft size={16} /> Volver al catálogo</Link>
      <Notice type="error">{error}</Notice>
    </main>
  );

  return (
    <main className="page-shell content-page">
      <Link className="back-link" to="/inicio"><ArrowLeft size={16} /> Volver al catálogo</Link>
      {notice && <Notice type={notice.includes("correctamente") || notice.includes("agregó") ? "success" : "error"} onClose={() => setNotice("")}>{notice}</Notice>}
      <section className="detail-hero">
        <div className="detail-art">
          <div className="art-orbit" />
          <Gamepad2 size={76} strokeWidth={1.1} />
          <span>GAMETECA · GAME PROFILE</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">FICHA DEL VIDEOJUEGO</span>
          <h1>{game.titulo}</h1>
          <div className="tag-list detail-tags">{(game.generos || []).map((item) => <span className="chip" key={item}>{item}</span>)}</div>
          <p className="detail-platforms">{(game.plataformas || []).join(" · ")}</p>
          <div className="detail-stats">
            <div><span className="stat-label">Promedio</span><strong>{reviewData?.promedio ?? "—"} <Star size={15} fill="currentColor" /></strong></div>
            <div><span className="stat-label">Reseñas</span><strong>{reviewData?.cantidad ?? 0}</strong></div>
            <div><span className="stat-label">Edad recomendada</span><strong>{game.caracteristicas?.rango_edad || "—"}</strong></div>
          </div>
          <div className="feature-list">
            {game.caracteristicas?.multijugador && <span>Multijugador</span>}
            {game.caracteristicas?.online && <span>Online</span>}
          </div>
          {user && <button className="button button-primary" onClick={addToLibrary} disabled={busy}>
            <Plus size={17} /> Agregar a mi biblioteca
          </button>}
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-heading">
          <div><span className="eyebrow">LO QUE OPINA LA COMUNIDAD</span><h2>Reseñas <span className="heading-count">{reviewData?.cantidad ?? 0}</span></h2></div>
          <p>{reviewData?.promedio == null ? "Todavía no hay puntuaciones." : `Puntuación media: ${reviewData.promedio} / 5`}</p>
        </div>

        {user && !myReview && (
          <form className="review-form panel" onSubmit={submitReview}>
            <h3>Comparte tu experiencia</h3>
            <label className="form-field">
              <span>Puntuación</span>
              <select value={form.puntuacion} onChange={(event) => setForm({ ...form, puntuacion: event.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5 estrellas</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Tu reseña</span>
              <textarea required minLength={3} maxLength={1000} rows={4} value={form.comentario}
                onChange={(event) => setForm({ ...form, comentario: event.target.value })}
                placeholder="¿Qué te pareció este videojuego?" />
            </label>
            <button className="button button-primary" disabled={busy}>Publicar reseña</button>
          </form>
        )}

        {user && myReview && (
          <div className="panel own-review-panel">
            <div><strong>Ya compartiste tu opinión sobre este juego.</strong><p>Puedes editar o eliminar tu reseña.</p></div>
            <div className="inline-actions">
              <button className="button button-secondary button-small" onClick={editReview}>Editar</button>
              <button className="button button-danger button-small" onClick={deleteReview} disabled={busy}>Eliminar</button>
            </div>
          </div>
        )}

        {editing && (
          <form className="review-form panel" onSubmit={submitReview}>
            <h3>Editar reseña</h3>
            <label className="form-field"><span>Puntuación</span>
              <select value={form.puntuacion} onChange={(event) => setForm({ ...form, puntuacion: event.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5 estrellas</option>)}
              </select>
            </label>
            <label className="form-field"><span>Tu reseña</span>
              <textarea required minLength={3} maxLength={1000} rows={4} value={form.comentario}
                onChange={(event) => setForm({ ...form, comentario: event.target.value })} />
            </label>
            <div className="inline-actions">
              <button className="button button-primary" disabled={busy}>Guardar cambios</button>
              <button type="button" className="button button-secondary" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </form>
        )}

        {reviewData?.resenas?.length ? (
          <div className="review-list">
            {reviewData.resenas.map((review) => (
              <article className="review-card panel" key={review._id}>
                <div className="review-avatar">{(review.usuarioId?.nombre || "G").slice(0, 1).toUpperCase()}</div>
                <div className="review-body">
                  <div className="review-heading">
                    <div><strong>{review.usuarioId?.nombre || "Jugador"}</strong><span>{new Date(review.fecha).toLocaleDateString()}</span></div>
                    <span className="rating"><Star size={14} fill="currentColor" /> {review.puntuacion} / 5</span>
                  </div>
                  <p>{review.comentario}</p>
                  {review.fecha_actualizacion && review.fecha &&
                    new Date(review.fecha_actualizacion).getTime() - new Date(review.fecha).getTime() > 1000 && (
                    <small className="muted">Editada el {new Date(review.fecha_actualizacion).toLocaleDateString()}</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty"><h3>Sin reseñas por ahora</h3><p>Cuando la comunidad comparta sus opiniones, aparecerán aquí.</p></div>
        )}
      </section>
    </main>
  );
}
