
const mongoose = require("mongoose");

const juegoGuardadoSchema = new mongoose.Schema({
  videojuegoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Videojuego",
    required: true
  },

  estado: {
    type: String,
    enum: ["pendiente", "jugando", "completado"],
    default: "pendiente"
  },

  fecha_agregado: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const bibliotecaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
    unique: true
  },

  juegos: {
    type: [juegoGuardadoSchema],
    default: []
  }
}, {
  collection: "bibliotecas"
});

module.exports = mongoose.model("Biblioteca", bibliotecaSchema);
