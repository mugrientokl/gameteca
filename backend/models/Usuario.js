
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },

  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  passwordHash: {
    type: String,
    required: true,
    select: false
  },

  rol: {
    type: String,
    enum: ["jugador", "admin"],
    default: "jugador"
  },

  passwordChangedAt: {
    type: Date
  },

  resetTokenHash: {
    type: String,
    select: false
  },

  resetTokenExpira: {
    type: Date,
    select: false
  },

  fecha_registro: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "usuarios"
});

module.exports = mongoose.model("Usuario", usuarioSchema);
