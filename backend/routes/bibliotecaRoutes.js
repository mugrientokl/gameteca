
const express = require("express");
const router = express.Router();

const {
  crearBiblioteca,
  obtenerBiblioteca,
  agregarVideojuego,
  cambiarEstado,
  quitarVideojuego
} = require("../controllers/bibliotecaController");

const {
  proteger,
  propietarioOAdmin,
  soloAdmin
} = require("../middlewares/authMiddleware");

router.use(proteger);

// Creación manual solo para administración.
// El registro público crea automáticamente la biblioteca.
router.post("/", soloAdmin, crearBiblioteca);

router.get(
  "/:usuarioId",
  propietarioOAdmin,
  obtenerBiblioteca
);

router.post(
  "/:usuarioId/juegos",
  propietarioOAdmin,
  agregarVideojuego
);

router.patch(
  "/:usuarioId/juegos/:videojuegoId",
  propietarioOAdmin,
  cambiarEstado
);

router.delete(
  "/:usuarioId/juegos/:videojuegoId",
  propietarioOAdmin,
  quitarVideojuego
);

module.exports = router;
