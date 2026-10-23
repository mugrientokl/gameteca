
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  registrar,
  login,
  perfil
} = require("../controllers/authController");

const { proteger } = require("../middlewares/authMiddleware");

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    mensaje: "Demasiados intentos. Inténtalo más tarde."
  }
});

router.post("/registro", limiteAuth, registrar);
router.post("/login", limiteAuth, login);
router.get("/perfil", proteger, perfil);

module.exports = router;
