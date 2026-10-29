
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");

exports.proteger = async (req, res, next) => {
  try {
    const encabezado = req.headers.authorization;

    if (!encabezado?.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "Token requerido"
      });
    }

    const token = encabezado.substring(7);

    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const usuario = await Usuario.findById(datos.sub);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Usuario no válido"
      });
    }

    // Las sesiones emitidas antes de un cambio de contraseña dejan de ser válidas
    if (usuario.passwordChangedAt &&
        datos.iat < Math.floor(usuario.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        mensaje: "La sesión expiró. Inicia sesión de nuevo"
      });
    }

    req.usuario = {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    };

    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o expirado"
    });
  }
};

exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({
      mensaje: "Acceso exclusivo para administradores"
    });
  }

  next();
};

exports.propietarioOAdmin = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.usuarioId)) {
    return res.status(400).json({
      mensaje: "ID de usuario inválido"
    });
  }

  const esPropietario = new mongoose.Types.ObjectId(req.usuario.id)
    .equals(req.params.usuarioId);

  const esAdmin = req.usuario?.rol === "admin";

  if (!esPropietario && !esAdmin) {
    return res.status(403).json({
      mensaje: "No tienes permiso para esta biblioteca"
    });
  }

  next();
};
