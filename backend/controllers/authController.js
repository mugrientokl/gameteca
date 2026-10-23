
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Usuario = require("../models/Usuario");
const Biblioteca = require("../models/Biblioteca");

const generarToken = (usuario) => {
  return jwt.sign(
    { sub: usuario._id.toString() },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "2h"
    }
  );
};

// REGISTRO
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (
      typeof nombre !== "string" ||
      typeof correo !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Datos de registro inválidos"
      });
    }

    if (password.length < 12 || password.length > 72) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener entre 12 y 72 caracteres"
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const existente = await Usuario.findOne({
      correo: correoNormalizado
    });

    if (existente) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario y biblioteca en una transacción.
    // Requiere MongoDB configurado como replica set.
    const session = await mongoose.startSession();

    let usuario;

    try {
      await session.withTransaction(async () => {
        const usuarios = await Usuario.create([{
          nombre,
          correo: correoNormalizado,
          passwordHash,
          rol: "jugador"
        }], { session });

        usuario = usuarios[0];

        await Biblioteca.create([{
          usuarioId: usuario._id,
          juegos: []
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      token: generarToken(usuario),
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        mensaje: "Datos inválidos",
        error: error.message
      });
    }

    console.error("Error de registro:", error);

    return res.status(500).json({
      mensaje: "No se pudo completar el registro"
    });
  }
};

// INICIO DE SESIÓN
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (
      typeof correo !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Credenciales inválidas"
      });
    }

    const usuario = await Usuario.findOne({
      correo: correo.trim().toLowerCase()
    }).select("+passwordHash");

    if (!usuario || !usuario.passwordHash) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
      });
    }

    const coincide = await bcrypt.compare(
      password,
      usuario.passwordHash
    );

    if (!coincide) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
      });
    }

    return res.json({
      mensaje: "Inicio de sesión correcto",
      token: generarToken(usuario),
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error de login:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// PERFIL DEL USUARIO AUTENTICADO
exports.perfil = async (req, res) => {
  return res.json({
    usuario: req.usuario
  });
};
