
const mongoose = require("mongoose");
const Biblioteca = require("../models/Biblioteca");
const Videojuego = require("../models/Videojuego");

const esIdValido = (id) =>
  mongoose.isObjectIdOrHexString(id);

const manejarError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: "El usuario ya tiene una biblioteca"
    });
  }

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({
      mensaje: "Datos inválidos",
      error: error.message
    });
  }

  console.error("Error en biblioteca:", error);

  return res.status(500).json({
    mensaje: "Error interno del servidor"
  });
};

// CREAR BIBLIOTECA
exports.crearBiblioteca = async (req, res) => {
  try {
    const { usuarioId } = req.body;

    if (!esIdValido(usuarioId)) {
      return res.status(400).json({
        mensaje: "ID de usuario inválido"
      });
    }

    const usuarioExiste = await mongoose.connection.db
      .collection("usuarios")
      .findOne({ _id: new mongoose.Types.ObjectId(usuarioId) });

    if (!usuarioExiste) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    const existente = await Biblioteca.findOne({ usuarioId });

    if (existente) {
      return res.status(409).json({
        mensaje: "El usuario ya tiene una biblioteca"
      });
    }

    const biblioteca = await Biblioteca.create({
      usuarioId,
      juegos: []
    });

    return res.status(201).json({
      mensaje: "Biblioteca creada correctamente",
      biblioteca
    });
  } catch (error) {
    return manejarError(error, res);
  }
};

// CONSULTAR BIBLIOTECA
exports.obtenerBiblioteca = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!esIdValido(usuarioId)) {
      return res.status(400).json({
        mensaje: "ID de usuario inválido"
      });
    }

    const biblioteca = await Biblioteca.findOne({ usuarioId })
      .populate("juegos.videojuegoId");

    if (!biblioteca) {
      return res.status(404).json({
        mensaje: "Biblioteca no encontrada"
      });
    }

    return res.json(biblioteca);
  } catch (error) {
    return manejarError(error, res);
  }
};

// AGREGAR VIDEOJUEGO
exports.agregarVideojuego = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { videojuegoId } = req.body;

    if (!esIdValido(usuarioId) || !esIdValido(videojuegoId)) {
      return res.status(400).json({
        mensaje: "Identificador inválido"
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

    const biblioteca = await Biblioteca.findOneAndUpdate(
      {
        usuarioId,
        "juegos.videojuegoId": {
          $ne: new mongoose.Types.ObjectId(videojuegoId)
        }
      },
      {
        $push: {
          juegos: {
            videojuegoId,
            estado: "pendiente",
            fecha_agregado: new Date()
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!biblioteca) {
      const existe = await Biblioteca.exists({ usuarioId });

      return res.status(existe ? 409 : 404).json({
        mensaje: existe
          ? "El videojuego ya está en la biblioteca"
          : "Biblioteca no encontrada"
      });
    }

    return res.json({
      mensaje: "Videojuego agregado correctamente",
      biblioteca
    });
  } catch (error) {
    return manejarError(error, res);
  }
};

// CAMBIAR ESTADO
exports.cambiarEstado = async (req, res) => {
  try {
    const { usuarioId, videojuegoId } = req.params;
    const { estado } = req.body;

    if (!esIdValido(usuarioId) || !esIdValido(videojuegoId)) {
      return res.status(400).json({
        mensaje: "Identificador inválido"
      });
    }

    const estados = ["pendiente", "jugando", "completado"];

    if (!estados.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado inválido"
      });
    }

    const biblioteca = await Biblioteca.findOneAndUpdate(
      {
        usuarioId,
        "juegos.videojuegoId":
          new mongoose.Types.ObjectId(videojuegoId)
      },
      {
        $set: {
          "juegos.$.estado": estado
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!biblioteca) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado en la biblioteca"
      });
    }

    return res.json({
      mensaje: "Estado actualizado correctamente",
      biblioteca
    });
  } catch (error) {
    return manejarError(error, res);
  }
};

// QUITAR VIDEOJUEGO
exports.quitarVideojuego = async (req, res) => {
  try {
    const { usuarioId, videojuegoId } = req.params;

    if (!esIdValido(usuarioId) || !esIdValido(videojuegoId)) {
      return res.status(400).json({
        mensaje: "Identificador inválido"
      });
    }

    const biblioteca = await Biblioteca.findOneAndUpdate(
      {
        usuarioId,
        "juegos.videojuegoId":
          new mongoose.Types.ObjectId(videojuegoId)
      },
      {
        $pull: {
          juegos: {
            videojuegoId:
              new mongoose.Types.ObjectId(videojuegoId)
          }
        }
      },
      { new: true }
    );

    if (!biblioteca) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado en la biblioteca"
      });
    }

    return res.json({
      mensaje: "Videojuego eliminado de la biblioteca",
      biblioteca
    });
  } catch (error) {
    return manejarError(error, res);
  }
};
