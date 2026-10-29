
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Videojuego = require("../models/Videojuego");
const Biblioteca = require("../models/Biblioteca");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// CREAR VIDEOJUEGO
exports.crearVideojuego = async (req, res) => {
  try {
    const { imagen, ...datos } = req.body;
    const videojuego = await Videojuego.create(datos);

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

    // Sin "pagina" se conserva la respuesta anterior (arreglo, máx. 100)
    if (req.query.pagina === undefined) {
      const videojuegos = await Videojuego.find(filtro)
        .sort({ titulo: 1 })
        .limit(100);

      return res.json(videojuegos);
    }

    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const limite = Math.min(
      Math.max(parseInt(req.query.limite, 10) || 12, 1),
      50
    );
    const orden = ORDENES[req.query.orden] ? req.query.orden : "titulo";

    const [resultado] = await Videojuego.aggregate([
      { $match: filtro },
      ...etapasEstadisticas(),
      { $sort: ORDENES[orden] },
      {
        $facet: {
          datos: [{ $skip: (pagina - 1) * limite }, { $limit: limite }],
          total: [{ $count: "n" }]
        }
      }
    ]);

    const total = resultado.total[0]?.n || 0;

    res.json({
      videojuegos: resultado.datos,
      total,
      pagina,
      paginas: Math.max(Math.ceil(total / limite), 1)
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// TOP 10 MEJOR VALORADOS
exports.obtenerTop = async (req, res) => {
  try {
    const top = await Videojuego.aggregate([
      { $match: { activo: { $ne: false } } },
      ...etapasEstadisticas(),
      { $match: { cantidad_resenas: { $gt: 0 } } },
      { $sort: ORDENES.puntuacion },
      { $limit: 10 }
    ]);

    res.json(top);
  } catch (error) {
    manejarError(error, res);
  }
};

// GÉNEROS Y PLATAFORMAS DISPONIBLES PARA LOS FILTROS
exports.obtenerFiltros = async (req, res) => {
  try {
    const base = { activo: { $ne: false } };
    const [generos, plataformas] = await Promise.all([
      Videojuego.distinct("generos", base),
      Videojuego.distinct("plataformas", base)
    ]);

    res.json({ generos: generos.sort(), plataformas: plataformas.sort() });
  } catch (error) {
    manejarError(error, res);
  }
};

const ORDENES = {
  titulo: { titulo: 1 },
  recientes: { fecha_registro: -1, _id: -1 },
  antiguos: { fecha_registro: 1, _id: 1 },
  puntuacion: { promedio: -1, cantidad_resenas: -1, titulo: 1 },
  populares: { usuarios_biblioteca: -1, titulo: 1 }
};

// Agrega promedio, cantidad de reseñas y usuarios que lo tienen en su biblioteca
function etapasEstadisticas() {
  return [
    {
      $lookup: {
        from: "resenas",
        let: { id: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$videojuegoId", "$$id"] } } },
          {
            $group: {
              _id: null,
              promedio: { $avg: "$puntuacion" },
              cantidad: { $sum: 1 }
            }
          }
        ],
        as: "_resenas"
      }
    },
    {
      $lookup: {
        from: "bibliotecas",
        let: { id: "$_id" },
        pipeline: [
          { $match: { $expr: { $in: ["$$id", "$juegos.videojuegoId"] } } },
          { $count: "n" }
        ],
        as: "_bibliotecas"
      }
    },
    {
      $addFields: {
        promedio: {
          $round: [{ $ifNull: [{ $arrayElemAt: ["$_resenas.promedio", 0] }, 0] }, 1]
        },
        cantidad_resenas: {
          $ifNull: [{ $arrayElemAt: ["$_resenas.cantidad", 0] }, 0]
        },
        usuarios_biblioteca: {
          $ifNull: [{ $arrayElemAt: ["$_bibliotecas.n", 0] }, 0]
        }
      }
    },
    { $project: { _resenas: 0, _bibliotecas: 0 } }
  ];
}

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

    const usuariosBiblioteca = await Biblioteca.countDocuments({
      "juegos.videojuegoId": videojuego._id
    });

    res.json({
      ...videojuego.toObject(),
      usuarios_biblioteca: usuariosBiblioteca
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// SUBIR IMAGEN DEL VIDEOJUEGO
exports.subirImagen = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    if (!req.file) {
      return res.status(400).json({ mensaje: "Debe enviar una imagen" });
    }

    const extension = detectarExtension(req.file.buffer);

    if (!extension) {
      return res.status(400).json({
        mensaje: "La imagen debe ser JPG, PNG o WEBP"
      });
    }

    const videojuego = await Videojuego.findById(req.params.id);

    if (!videojuego) {
      return res.status(404).json({
        mensaje: "Videojuego no encontrado"
      });
    }

    const nombre = `${videojuego._id}-${Date.now()}.${extension}`;
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOADS_DIR, nombre), req.file.buffer);

    const anterior = videojuego.imagen;
    videojuego.imagen = `/uploads/${nombre}`;
    await videojuego.save();

    if (anterior && anterior.startsWith("/uploads/")) {
      fs.promises
        .unlink(path.join(UPLOADS_DIR, path.basename(anterior)))
        .catch(() => {});
    }

    res.json({
      mensaje: "Imagen actualizada correctamente",
      videojuego
    });
  } catch (error) {
    manejarError(error, res);
  }
};

// Valida el tipo real del archivo por su firma, no por el nombre enviado
function detectarExtension(buffer) {
  if (buffer.length > 12) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "jpg";
    }
    if (buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )) {
      return "png";
    }
    if (buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP") {
      return "webp";
    }
  }
  return null;
}

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
