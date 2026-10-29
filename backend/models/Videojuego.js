const mongoose = require("mongoose");

const videojuegoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, "El título es obligatorio"],
    trim: true,
    minlength: 2,
    maxlength: 150
  },

  generos: {
    type: [String],
    required: true,
    validate: {
      validator: (valor) =>
        Array.isArray(valor) &&
        valor.length > 0 &&
        valor.every(g => typeof g === "string" && g.trim().length > 0),
      message: "Debe indicar al menos un género válido"
    }
  },

  plataformas: {
    type: [String],
    required: true,
    validate: {
      validator: (valor) =>
        Array.isArray(valor) &&
        valor.length > 0 &&
        valor.every(p => typeof p === "string" && p.trim().length > 0),
      message: "Debe indicar al menos una plataforma válida"
    }
  },

  caracteristicas: {
    multijugador: {
      type: Boolean,
      default: false
    },
    online: {
      type: Boolean,
      default: false
    },
    rango_edad: {
      type: String,
      trim: true
    }
  },

  imagen: {
    type: String,
    trim: true,
    default: ""
  },

  fecha_registro: {
    type: Date,
    default: Date.now
  },

  activo: {
    type: Boolean,
    default: true
  }
}, {
  collection: "videojuegos"
});

module.exports = mongoose.model("Videojuego", videojuegoSchema);