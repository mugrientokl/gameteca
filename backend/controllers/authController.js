
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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

const datosUsuario = (usuario) => ({
  id: usuario._id,
  nombre: usuario.nombre,
  correo: usuario.correo,
  rol: usuario.rol
});

const validarPasswordNueva = (password) =>
  typeof password === "string" &&
  password.length >= 12 &&
  password.length <= 72;

// EDITAR PERFIL (NOMBRE Y/O CONTRASEÑA)
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, passwordActual, passwordNueva } = req.body;
    const cambiaNombre = nombre !== undefined;
    const cambiaPassword = passwordNueva !== undefined && passwordNueva !== "";

    if (!cambiaNombre && !cambiaPassword) {
      return res.status(400).json({
        mensaje: "No hay cambios para guardar"
      });
    }

    if (cambiaNombre && typeof nombre !== "string") {
      return res.status(400).json({ mensaje: "Nombre inválido" });
    }

    const usuario = await Usuario.findById(req.usuario.id)
      .select("+passwordHash");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (cambiaPassword) {
      if (typeof passwordActual !== "string" || !passwordActual) {
        return res.status(400).json({
          mensaje: "Debes indicar tu contraseña actual"
        });
      }

      if (!validarPasswordNueva(passwordNueva)) {
        return res.status(400).json({
          mensaje: "La contraseña debe tener entre 12 y 72 caracteres"
        });
      }

      const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);

      if (!coincide) {
        return res.status(401).json({
          mensaje: "La contraseña actual es incorrecta"
        });
      }

      usuario.passwordHash = await bcrypt.hash(passwordNueva, 12);
      usuario.passwordChangedAt = new Date();
    }

    if (cambiaNombre) {
      usuario.nombre = nombre;
    }

    await usuario.save();

    return res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: datosUsuario(usuario),
      ...(cambiaPassword ? { token: generarToken(usuario) } : {})
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        mensaje: "Datos inválidos",
        error: error.message
      });
    }

    console.error("Error al actualizar perfil:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// Responde siempre igual para no revelar qué correos existen.
exports.olvidePassword = async (req, res) => {
  const respuesta = {
    mensaje: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"
  };

  try {
    const { correo } = req.body;

    if (typeof correo !== "string") {
      return res.status(400).json({ mensaje: "Correo inválido" });
    }

    const usuario = await Usuario.findOne({
      correo: correo.trim().toLowerCase()
    });

    if (usuario) {
      const token = crypto.randomBytes(32).toString("hex");

      usuario.resetTokenHash = hashToken(token);
      usuario.resetTokenExpira = new Date(Date.now() + 60 * 60 * 1000);
      await usuario.save();

      const base = process.env.FRONTEND_URL || "http://localhost:5173";

      // No hay servicio de correo configurado: el enlace se muestra en la consola del servidor.
      console.log(
        `[Recuperación] Enlace para ${usuario.correo} (válido 1 hora): ` +
        `${base}/restablecer?token=${token}`
      );
    }

    return res.json(respuesta);
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// RESTABLECER CONTRASEÑA CON EL TOKEN RECIBIDO
exports.restablecerPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({
        mensaje: "El enlace no es válido o expiró"
      });
    }

    if (!validarPasswordNueva(password)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener entre 12 y 72 caracteres"
      });
    }

    const usuario = await Usuario.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpira: { $gt: new Date() }
    }).select("+resetTokenHash +resetTokenExpira");

    if (!usuario) {
      return res.status(400).json({
        mensaje: "El enlace no es válido o expiró"
      });
    }

    usuario.passwordHash = await bcrypt.hash(password, 12);
    usuario.passwordChangedAt = new Date();
    usuario.resetTokenHash = undefined;
    usuario.resetTokenExpira = undefined;
    await usuario.save();

    return res.json({
      mensaje: "Contraseña restablecida correctamente. Ya puedes iniciar sesión"
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};
