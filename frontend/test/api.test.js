import assert from "node:assert/strict";
import test from "node:test";
import { api, ApiError } from "../src/services/api.js";
import { filterCatalogGames } from "../src/services/catalog.js";

test("el cliente HTTP usa endpoints, métodos, bodies y errores del backend", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/api/auth/perfil")) {
      return new Response(JSON.stringify({ usuario: { id: "u1", rol: "jugador" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (String(url).includes("/api/resenas/videojuego/")) {
      return new Response(JSON.stringify({
        videojuego: "Juego",
        cantidad: 0,
        promedio: null,
        resenas: []
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ mensaje: "Ya publicaste una reseña de este videojuego" }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const profile = await api.profile("jwt-token");
    assert.deepEqual(profile, { usuario: { id: "u1", rol: "jugador" } });
    assert.equal(calls[0].options.headers.Authorization, "Bearer jwt-token");
    assert.equal(calls[0].options.method, undefined);

    const reviews = await api.reviews("game/1");
    assert.equal(reviews.videojuego, "Juego");
    assert.equal(new URL(calls[1].url).pathname, "/api/resenas/videojuego/game%2F1");

    await assert.rejects(
      api.createReview({ videojuegoId: "g1", puntuacion: 5, comentario: "Muy bueno" }, "jwt-token"),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 409);
        assert.match(error.message, /reseña/);
        return true;
      }
    );
    assert.equal(calls[2].options.method, "POST");
    assert.equal(calls[2].options.headers.Authorization, "Bearer jwt-token");
    assert.deepEqual(JSON.parse(calls[2].options.body), {
      videojuegoId: "g1",
      puntuacion: 5,
      comentario: "Muy bueno"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("el cliente envía los filtros de catálogo como parámetros de búsqueda", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    await api.games({
      titulo: "The Legend",
      genero: "Aventura",
      plataforma: "PC"
    });

    const url = new URL(requestedUrl);
    assert.equal(url.pathname, "/api/videojuegos");
    assert.equal(url.searchParams.get("titulo"), "The Legend");
    assert.equal(url.searchParams.get("genero"), "Aventura");
    assert.equal(url.searchParams.get("plataforma"), "PC");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("el catálogo filtra por título, género y plataforma seleccionados", () => {
  const games = [
    {
      titulo: "Terraria",
      generos: ["Aventura", "Sandbox"],
      plataformas: ["PC", "Xbox"]
    },
    {
      titulo: "Minecraft",
      generos: ["Sandbox"],
      plataformas: ["PC", "PlayStation", "Xbox"]
    },
    {
      titulo: "Fifa",
      generos: ["Deportes"],
      plataformas: ["PC", "PlayStation", "Xbox"]
    }
  ];

  assert.deepEqual(
    filterCatalogGames(games, {
      titulo: "",
      genero: "Aventura",
      plataforma: ""
    }).map((game) => game.titulo),
    ["Terraria"]
  );
  assert.deepEqual(
    filterCatalogGames(games, {
      titulo: "terr",
      genero: "Aventura",
      plataforma: "PC"
    }).map((game) => game.titulo),
    ["Terraria"]
  );
  assert.deepEqual(
    filterCatalogGames(games, {
      titulo: "",
      genero: "Aventura",
      plataforma: "PlayStation"
    }),
    []
  );
});
