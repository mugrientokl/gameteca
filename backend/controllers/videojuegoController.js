
const mongoose = require("mongoose");
const Videojuego = require("../models/Videojuego");

// CREAR VIDEOJUEGO
exports.crearVideojuego = async (req, res) => {
  try {
    const videojuego = await Videojuego.create(req.body);

    res.status(201).json({
      mensaje: "Videojuego registrado correctamente",
      videojuego
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// LISTAR, BUSCAR Y FILTRAR VIDEOJUEGOS
exports.obtenerVideojuegos = async (req, res) => {
  try {
    const { titulo, genero, plataforma } = req.query;
    // $ne:false also includes legacy documents without the activo field.
    const filtro = { activo: { $ne: false } };

    if (titulo) {
      if (typeof titulo !== "string" || titulo.length > 100) {
        return res.status(400).json({
          mensaje: "Filtro de título inválido"
        });
      }

      // Escapar caracteres especiales de expresiones regulares
      const textoSeguro = titulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtro.titulo = { $regex: textoSeguro, $options: "i" };
    }

    if (genero) {
      if (typeof genero !== "string") {
        return res.status(400).json({ mensaje: "Género inválido" });
      }
      filtro.generos = genero;
    }

    if (plataforma) {
      if (typeof plataforma !== "string") {
        return res.status(400).json({ mensaje: "Plataforma inválida" });
      }
      filtro.plataformas = plataforma;
    }

    const videojuegos = await Videojuego.find(filtro)
      .sort({ titulo: 1 })
      .limit(100);

    res.json(videojuegos);
  } catch (error) {
    manejarError(error, res);
  }
};

// CONSULTAR VIDEOJUEGO POR ID
exports.obtenerVideojuegoPorId = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const videojuego = await Videojuego.findOne({
      _id: req.params.id,
      activo: { $ne: false }
    });

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado"
      });
    }

    res.json(videojuego);
  } catch (error) {
    manejarError(error, res);
  }
};

// LISTAR VIDEOJUEGOS INACTIVOS (ADMINISTRACIÓN)
exports.obtenerVideojuegosInactivos = async (req, res) => {
  try {
    const videojuegos = await Videojuego.find({ activo: false })
      .sort({ titulo: 1 })
      .limit(100);

    res.json(videojuegos);
  } catch (error) {
    manejarError(error, res);
  }
};

// ACTUALIZAR VIDEOJUEGO
exports.actualizarVideojuego = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const permitidos = [
      "titulo", "generos", "plataformas", "caracteristicas"
    ];

    const campos = Object.keys(req.body);

    if (!campos.length || campos.some(c => !permitidos.includes(c))) {
      return res.status(400).json({
        mensaje: "Debe enviar campos permitidos para actualizar"
      });
    }

    const videojuego = await Videojuego.findById(req.params.id);

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado"
      });
    }

    for (const campo of campos) {
      videojuego.set(campo, req.body[campo]);
    }

    await videojuego.save();

    res.json({
      mensaje: "Videojuego actualizado correctamente",
      videojuego
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// ELIMINAR VIDEOJUEGO
exports.eliminarVideojuego = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const videojuego = await Videojuego.findOneAndUpdate(
      {
        _id: req.params.id,
        activo: { $ne: false }
      },
      { $set: { activo: false } },
      { new: true, runValidators: true }
    );

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado o ya está inactivo"
      });
    }

    res.json({
      mensaje: "Videojuego eliminado correctamente"
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// REACTIVAR VIDEOJUEGO
exports.reactivarVideojuego = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const videojuego = await Videojuego.findById(req.params.id);

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado"
      });
    }

    if (!videojuego.activo) {
      videojuego.activo = true;
      await videojuego.save();
    }

    res.json({
      mensaje: "Videojuego reactivado correctamente",
      videojuego
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// MANEJO CENTRALIZADO DE ERRORES
function manejarError(error, res) {
  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.name === "StrictModeError"
  ) {
    return res.status(400).json({
      mensaje: "Datos inválidos",
      error: error.message
    });
  }

  console.error("Error en videojuegos:", error);

  res.status(500).json({
    mensaje: "Error interno del servidor"
  });
}
