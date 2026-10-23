
const mongoose = require("mongoose");
const Resena = require("../models/Resena");
const Videojuego = require("../models/Videojuego");

// CREAR RESEÑA
exports.crearResena = async (req, res) => {
  try {
    const { videojuegoId, puntuacion, comentario } = req.body;
    const usuarioId = req.usuario.id;

    if (!mongoose.isObjectIdOrHexString(videojuegoId)) {
      return res.status(400).json({
        mensaje: "ID de videojuego inválido"
      });
    }

    const videojuego = await Videojuego.findOne({
      _id: videojuegoId,
      activo: { $ne: false }
    });

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado o inactivo"
      });
    }

    const resena = await Resena.create({
      usuarioId,
      videojuegoId,
      puntuacion,
      comentario
    });

    return res.status(201).json({
      mensaje: "Reseña publicada correctamente",
      resena
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: "Ya publicaste una reseña de este videojuego"
      });
    }

    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        mensaje: "Datos de reseña inválidos",
        error: error.message
      });
    }

    console.error("Error al crear reseña:", error);
    return res.status(500).json({
      mensaje: "Error interno al crear reseña"
    });
  }
};

// CONSULTAR RESEÑAS DE UN VIDEOJUEGO
exports.obtenerResenas = async (req, res) => {
  try {
    const { videojuegoId } = req.params;

    if (!mongoose.isObjectIdOrHexString(videojuegoId)) {
      return res.status(400).json({
        mensaje: "ID inválido"
      });
    }

    const videojuego = await Videojuego.findOne({
      _id: videojuegoId,
      activo: { $ne: false }
    });

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado"
      });
    }

    const resenas = await Resena.find({ videojuegoId })
      .populate("usuarioId", "nombre")
      .sort({ fecha: -1 });

    const cantidad = resenas.length;

    const promedio = cantidad
      ? resenas.reduce((total, r) => total + r.puntuacion, 0) / cantidad
      : null;

    return res.json({
      videojuego: videojuego.titulo,
      cantidad,
      promedio: promedio === null ? null : Number(promedio.toFixed(2)),
      resenas
    });

  } catch (error) {
    console.error("Error al consultar reseñas:", error);
    return res.status(500).json({
      mensaje: "Error interno al consultar reseñas"
    });
  }
};

// ACTUALIZAR RESEÑA
exports.actualizarResena = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        mensaje: "Reseña no encontrada"
      });
    }

    if (!resena.usuarioId.equals(req.usuario.id)) {
      return res.status(403).json({
        mensaje: "Solo el autor puede editar esta reseña"
      });
    }

    const { puntuacion, comentario } = req.body;

    if (puntuacion === undefined && comentario === undefined) {
      return res.status(400).json({
        mensaje: "Debes indicar un campo para actualizar"
      });
    }

    if (puntuacion !== undefined) resena.puntuacion = puntuacion;
    if (comentario !== undefined) resena.comentario = comentario;

    resena.fecha_actualizacion = new Date();

    await resena.save();

    return res.json({
      mensaje: "Reseña actualizada correctamente",
      resena
    });

  } catch (error) {
    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        mensaje: "Datos inválidos",
        error: error.message
      });
    }

    console.error("Error al actualizar reseña:", error);
    return res.status(500).json({
      mensaje: "Error interno al actualizar reseña"
    });
  }
};

// ELIMINAR RESEÑA
exports.eliminarResena = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        mensaje: "Reseña no encontrada"
      });
    }

    const esAutor = resena.usuarioId.equals(req.usuario.id);
    const esAdmin = req.usuario.rol === "admin";

    if (!esAutor && !esAdmin) {
      return res.status(403).json({
        mensaje: "No tienes permiso para eliminar esta reseña"
      });
    }

    await resena.deleteOne();

    return res.json({
      mensaje: "Reseña eliminada correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    return res.status(500).json({
      mensaje: "Error interno al eliminar reseña"
    });
  }
};
