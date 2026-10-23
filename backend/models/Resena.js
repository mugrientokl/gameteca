
const mongoose = require("mongoose");

const resenaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },

  videojuegoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Videojuego",
    required: true
  },

  puntuacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "La puntuación debe ser un número entero"
    }
  },

  comentario: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 1000
  },

  fecha: {
    type: Date,
    default: Date.now
  },

  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "resenas"
});

// Evitar reseñas duplicadas del mismo usuario
resenaSchema.index(
  { usuarioId: 1, videojuegoId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Resena", resenaSchema);
