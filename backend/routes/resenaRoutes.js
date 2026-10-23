
const express = require("express");
const router = express.Router();

const {
  crearResena,
  obtenerResenas,
  actualizarResena,
  eliminarResena
} = require("../controllers/resenaController");

const { proteger } = require("../middlewares/authMiddleware");

// Consultar reseñas: público
router.get("/videojuego/:videojuegoId", obtenerResenas);

// Crear reseña: usuario autenticado
router.post("/", proteger, crearResena);

// Editar reseña: solo autor
router.put("/:id", proteger, actualizarResena);

// Eliminar reseña: autor o administrador
router.delete("/:id", proteger, eliminarResena);

module.exports = router;
