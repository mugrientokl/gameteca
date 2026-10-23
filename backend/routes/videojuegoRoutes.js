
const express = require("express");
const router = express.Router();

const {
  crearVideojuego,
  obtenerVideojuegos,
  obtenerVideojuegoPorId,
  obtenerVideojuegosInactivos,
  actualizarVideojuego,
  eliminarVideojuego,
  reactivarVideojuego
} = require("../controllers/videojuegoController");

const {
  proteger,
  soloAdmin
} = require("../middlewares/authMiddleware");

router.get("/", obtenerVideojuegos);
router.get("/inactivos", proteger, soloAdmin, obtenerVideojuegosInactivos);
router.patch("/:id/reactivar", proteger, soloAdmin, reactivarVideojuego);
router.get("/:id", obtenerVideojuegoPorId);

router.post("/", proteger, soloAdmin, crearVideojuego);
router.put("/:id", proteger, soloAdmin, actualizarVideojuego);
router.delete("/:id", proteger, soloAdmin, eliminarVideojuego);

module.exports = router;
