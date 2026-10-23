
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const conectarDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const videojuegoRoutes = require("./routes/videojuegoRoutes");
const bibliotecaRoutes = require("./routes/bibliotecaRoutes");
const resenaRoutes = require("./routes/resenaRoutes");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "100kb" }));

// Controlar JSON mal formado
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError &&
      error.status === 400 &&
      "body" in error) {
    return res.status(400).json({
      mensaje: "El cuerpo contiene un JSON inválido"
    });
  }

  next(error);
});

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de GameTeca funcionando"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/videojuegos", videojuegoRoutes);
app.use("/api/bibliotecas", bibliotecaRoutes);
app.use("/api/resenas", resenaRoutes);

const PORT = process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET no está configurado correctamente");
  }

  await conectarDB();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`GameTeca: http://127.0.0.1:${PORT}`);
  });
}

iniciar().catch(error => {
  console.error("Error al iniciar:", error.message);
  process.exit(1);
});
