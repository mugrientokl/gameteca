
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("node:readline/promises");

const Usuario = require("../models/Usuario");
const Biblioteca = require("../models/Biblioteca");

async function crearAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const nombre = (await rl.question("Nombre del administrador: ")).trim();
    const correo = (await rl.question("Correo del administrador: "))
      .trim().toLowerCase();

    // Para esta prueba local, la contraseña se solicita
    // interactivamente. No se almacena en el código.
    const password = await rl.question("Contraseña (mínimo 12 caracteres): ");

    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      throw new Error("Nombre o correo inválido");
    }

    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("La contraseña debe tener al menos 12 caracteres y no superar 72 bytes");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existente = await Usuario.findOne({ correo });

    if (existente) {
      throw new Error("Ya existe un usuario con ese correo");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const [admin] = await Usuario.create([{
          nombre,
          correo,
          passwordHash,
          rol: "admin"
        }], { session });

        await Biblioteca.create([{
          usuarioId: admin._id,
          juegos: []
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    console.log("Administrador creado correctamente");

  } catch (error) {
    console.error("No se pudo crear el administrador:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

crearAdmin();
