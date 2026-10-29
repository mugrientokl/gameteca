const API_URL = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:3000")
  .replace(/\/$/, "");

const STATUS_MESSAGES = {
  400: "La solicitud contiene datos inválidos.",
  401: "Tu sesión expiró o las credenciales no son válidas.",
  403: "No tienes permiso para realizar esta acción.",
  404: "No se encontró el recurso solicitado.",
  409: "La operación entra en conflicto con datos existentes.",
  500: "El servidor encontró un error. Inténtalo más tarde."
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, { token, body, headers, ...options } = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {})
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con GameTeca (${API_URL}). Comprueba que el backend esté iniciado.`,
      0
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.mensaje
      || STATUS_MESSAGES[response.status]
      || `La solicitud falló (HTTP ${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export const imageUrl = (path) => (path ? `${API_URL}${path}` : "");

export const api = {
  register: (body) => request("/api/auth/registro", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  profile: (token) => request("/api/auth/perfil", { token }),
  updateProfile: (body, token) => request("/api/auth/perfil", { method: "PUT", body, token }),
  forgotPassword: (correo) => request("/api/auth/olvide-password", { method: "POST", body: { correo } }),
  resetPassword: (token, password) => request("/api/auth/restablecer-password", { method: "POST", body: { token, password } }),

  games: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const search = query.toString();
    const suffix = search ? `?${search}` : "";
    return request(`/api/videojuegos${suffix}`);
  },
  gamesPage: (params = {}) => api.games({ pagina: 1, ...params }),
  topGames: () => request("/api/videojuegos/top"),
  gameFilters: () => request("/api/videojuegos/filtros"),
  game: (id) => request(`/api/videojuegos/${encodeURIComponent(id)}`),
  createGame: (body, token) => request("/api/videojuegos", {
    method: "POST", body, token
  }),
  updateGame: (id, body, token) => request(
    `/api/videojuegos/${encodeURIComponent(id)}`,
    { method: "PUT", body, token }
  ),
  deactivateGame: (id, token) => request(
    `/api/videojuegos/${encodeURIComponent(id)}`,
    { method: "DELETE", token }
  ),
  inactiveGames: (token) => request("/api/videojuegos/inactivos", { token }),
  uploadGameImage: (id, file, token) => {
    const body = new FormData();
    body.append("imagen", file);
    return request(`/api/videojuegos/${encodeURIComponent(id)}/imagen`, {
      method: "POST", body, token
    });
  },
  reactivateGame: (id, token) => request(
    `/api/videojuegos/${encodeURIComponent(id)}/reactivar`,
    { method: "PATCH", token }
  ),

  library: (userId, token) => request(
    `/api/bibliotecas/${encodeURIComponent(userId)}`,
    { token }
  ),
  addToLibrary: (userId, videojuegoId, token) => request(
    `/api/bibliotecas/${encodeURIComponent(userId)}/juegos`,
    { method: "POST", body: { videojuegoId }, token }
  ),
  updateLibraryState: (userId, gameId, estado, token) => request(
    `/api/bibliotecas/${encodeURIComponent(userId)}/juegos/${encodeURIComponent(gameId)}`,
    { method: "PATCH", body: { estado }, token }
  ),
  removeFromLibrary: (userId, gameId, token) => request(
    `/api/bibliotecas/${encodeURIComponent(userId)}/juegos/${encodeURIComponent(gameId)}`,
    { method: "DELETE", token }
  ),

  reviews: (gameId) => request(
    `/api/resenas/videojuego/${encodeURIComponent(gameId)}`
  ),
  createReview: (body, token) => request("/api/resenas", {
    method: "POST", body, token
  }),
  updateReview: (id, body, token) => request(
    `/api/resenas/${encodeURIComponent(id)}`,
    { method: "PUT", body, token }
  ),
  deleteReview: (id, token) => request(
    `/api/resenas/${encodeURIComponent(id)}`,
    { method: "DELETE", token }
  )
};
