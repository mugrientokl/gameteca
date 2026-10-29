
const express = require("express");
const router = express.Router();

const {
  crearVideojuego,
  obtenerVideojuegos,
  obtenerVideojuegoPorId,
  obtenerVideojuegosInactivos,
  actualizarVideojuego,
  eliminarVideojuego,
  reactivarVideojuego,
  subirImagen,
  obtenerTop,
  obtenerFiltros
} = require("../controllers/videojuegoController");

const multer = require("multer");

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

const recibirImagen = (req, res, next) => {
  subida.single("imagen")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        mensaje: error.code === "LIMIT_FILE_SIZE"
          ? "La imagen no puede superar 2 MB"
          : "Archivo inválido"
      });
    }
    next();
  });
};

const {
  proteger,
  soloAdmin
} = require("../middlewares/authMiddleware");

router.get("/", obtenerVideojuegos);
router.get("/top", obtenerTop);
router.get("/filtros", obtenerFiltros);
router.get("/inactivos", proteger, soloAdmin, obtenerVideojuegosInactivos);
router.patch("/:id/reactivar", proteger, soloAdmin, reactivarVideojuego);
router.get("/:id", obtenerVideojuegoPorId);

router.post("/", proteger, soloAdmin, crearVideojuego);
router.post("/:id/imagen", proteger, soloAdmin, recibirImagen, subirImagen);
router.put("/:id", proteger, soloAdmin, actualizarVideojuego);
router.delete("/:id", proteger, soloAdmin, eliminarVideojuego);

module.exports = router;
