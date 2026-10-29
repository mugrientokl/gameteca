
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  registrar,
  login,
  perfil,
  actualizarPerfil,
  olvidePassword,
  restablecerPassword
} = require("../controllers/authController");

const { proteger } = require("../middlewares/authMiddleware");

const mensajeLimite = {
  mensaje: "Demasiados intentos. Inténtalo más tarde."
};

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensajeLimite
});

// Solo cuentan los intentos fallidos de inicio de sesión
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    mensaje: "Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo."
  }
});

const limiteRecuperacion = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensajeLimite
});

router.post("/registro", limiteAuth, registrar);
router.post("/login", limiteLogin, login);
router.post("/olvide-password", limiteRecuperacion, olvidePassword);
router.post("/restablecer-password", limiteAuth, restablecerPassword);
router.get("/perfil", proteger, perfil);
router.put("/perfil", proteger, limiteAuth, actualizarPerfil);

module.exports = router;
