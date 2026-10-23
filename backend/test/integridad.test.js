const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");

const Biblioteca = require("../models/Biblioteca");
const Videojuego = require("../models/Videojuego");
const Resena = require("../models/Resena");
const videojuegoController = require("../controllers/videojuegoController");
const bibliotecaController = require("../controllers/bibliotecaController");
const resenaController = require("../controllers/resenaController");
const { propietarioOAdmin } = require("../middlewares/authMiddleware");

function crearRespuesta() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("Videojuego nuevo tiene activo=true por defecto", () => {
  const videojuego = new Videojuego({
    titulo: "Juego de prueba",
    generos: ["Aventura"],
    plataformas: ["PC"]
  });

  assert.equal(videojuego.activo, true);
});

test("el catálogo incluye documentos activos y heredados sin activo", async () => {
  const originalFind = Videojuego.find;
  let filtroRecibido;

  Videojuego.find = (filtro) => {
    filtroRecibido = filtro;
    return {
      sort: () => ({
        limit: async () => []
      })
    };
  };

  try {
    const res = crearRespuesta();
    await videojuegoController.obtenerVideojuegos({ query: {} }, res);

    assert.deepEqual(filtroRecibido.activo, { $ne: false });
    assert.deepEqual(res.body, []);
  } finally {
    Videojuego.find = originalFind;
  }
});

test("el catálogo aplica los filtros recibidos", async () => {
  const originalFind = Videojuego.find;
  let filtroRecibido;

  Videojuego.find = (filtro) => {
    filtroRecibido = filtro;
    return {
      sort: () => ({
        limit: async () => []
      })
    };
  };

  try {
    const res = crearRespuesta();
    await videojuegoController.obtenerVideojuegos({
      query: {
        titulo: "zelda",
        genero: "Aventura",
        plataforma: "PC"
      }
    }, res);

    assert.deepEqual(filtroRecibido.activo, { $ne: false });
    assert.deepEqual(filtroRecibido.titulo, { $regex: "zelda", $options: "i" });
    assert.equal(filtroRecibido.generos, "Aventura");
    assert.equal(filtroRecibido.plataformas, "PC");
  } finally {
    Videojuego.find = originalFind;
  }
});

test("cambiar el progreso devuelve los videojuegos de la biblioteca poblados", async () => {
  const originalFindOneAndUpdate = Biblioteca.findOneAndUpdate;
  const videojuegoId = "507f1f77bcf86cd799439011";
  const usuarioId = "507f1f77bcf86cd799439012";
  const biblioteca = { juegos: [] };
  let filtroRecibido;
  let actualizacionRecibida;
  let referenciaPoblada;

  Biblioteca.findOneAndUpdate = (filtro, actualizacion) => {
    filtroRecibido = filtro;
    actualizacionRecibida = actualizacion;
    return {
      populate(referencia) {
        referenciaPoblada = referencia;
        return Promise.resolve(biblioteca);
      }
    };
  };

  try {
    const res = crearRespuesta();
    await bibliotecaController.cambiarEstado({
      params: { usuarioId, videojuegoId },
      body: { estado: "jugando" }
    }, res);

    assert.equal(filtroRecibido.usuarioId, usuarioId);
    assert.equal(
      filtroRecibido["juegos.videojuegoId"].toString(),
      videojuegoId
    );
    assert.deepEqual(actualizacionRecibida, {
      $set: { "juegos.$.estado": "jugando" }
    });
    assert.equal(referenciaPoblada, "juegos.videojuegoId");
    assert.equal(res.body.biblioteca, biblioteca);
  } finally {
    Biblioteca.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("la consulta pública por ID no devuelve videojuegos inactivos", async () => {
  const originalFindOne = Videojuego.findOne;
  let filtroRecibido;
  Videojuego.findOne = async (filtro) => {
    filtroRecibido = filtro;
    return null;
  };

  try {
    const res = crearRespuesta();
    await videojuegoController.obtenerVideojuegoPorId({
      params: { id: "507f1f77bcf86cd799439011" }
    }, res);

    assert.equal(filtroRecibido.activo.$ne, false);
    assert.equal(res.statusCode, 404);
  } finally {
    Videojuego.findOne = originalFindOne;
  }
});

test("el borrado desactiva el videojuego en vez de eliminarlo", async () => {
  const originalFindOneAndUpdate = Videojuego.findOneAndUpdate;
  let filtroRecibido;
  let actualizacionRecibida;

  Videojuego.findOneAndUpdate = async (filtro, actualizacion) => {
    filtroRecibido = filtro;
    actualizacionRecibida = actualizacion;
    return { activo: false };
  };

  try {
    const res = crearRespuesta();
    await videojuegoController.eliminarVideojuego({
      params: { id: "507f1f77bcf86cd799439011" }
    }, res);

    assert.equal(filtroRecibido.activo.$ne, false);
    assert.deepEqual(actualizacionRecibida, { $set: { activo: false } });
    assert.equal(res.statusCode, 200);
  } finally {
    Videojuego.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("el administrador puede consultar únicamente videojuegos inactivos", async () => {
  const originalFind = Videojuego.find;
  let filtroRecibido;

  Videojuego.find = (filtro) => {
    filtroRecibido = filtro;
    return {
      sort: () => ({
        limit: async () => []
      })
    };
  };

  try {
    const res = crearRespuesta();
    await videojuegoController.obtenerVideojuegosInactivos({}, res);

    assert.deepEqual(filtroRecibido, { activo: false });
    assert.deepEqual(res.body, []);
  } finally {
    Videojuego.find = originalFind;
  }
});

test("la reactivación vuelve a guardar activo=true", async () => {
  const originalFindById = Videojuego.findById;
  let guardado = false;
  Videojuego.findById = async () => ({
    activo: false,
    save: async function guardar() {
      guardado = true;
      this.activo = true;
    }
  });

  try {
    const res = crearRespuesta();
    await videojuegoController.reactivarVideojuego({
      params: { id: "507f1f77bcf86cd799439011" }
    }, res);

    assert.equal(guardado, true);
    assert.equal(res.body.videojuego.activo, true);
  } finally {
    Videojuego.findById = originalFindById;
  }
});

test("no se agrega un videojuego inactivo a una biblioteca", async () => {
  const originalFindOne = Videojuego.findOne;
  Videojuego.findOne = async () => null;

  try {
    const res = crearRespuesta();
    await bibliotecaController.agregarVideojuego({
      params: { usuarioId: "507f1f77bcf86cd799439012" },
      body: { videojuegoId: "507f1f77bcf86cd799439011" }
    }, res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.mensaje, /inactivo/);
  } finally {
    Videojuego.findOne = originalFindOne;
  }
});

test("no se crea una reseña para un videojuego inactivo", async () => {
  const originalFindOne = Videojuego.findOne;
  Videojuego.findOne = async () => null;

  try {
    const res = crearRespuesta();
    await resenaController.crearResena({
      usuario: { id: "507f1f77bcf86cd799439012" },
      body: {
        videojuegoId: "507f1f77bcf86cd799439011",
        puntuacion: 5,
        comentario: "Muy bueno"
      }
    }, res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.mensaje, /inactivo/);
  } finally {
    Videojuego.findOne = originalFindOne;
  }
});

test("la propiedad de biblioteca compara ObjectId sin distinguir mayúsculas", () => {
  const usuarioId = new mongoose.Types.ObjectId();
  let siguiente = false;
  const res = crearRespuesta();

  propietarioOAdmin({
    usuario: { id: usuarioId.toString() },
    params: { usuarioId: usuarioId.toString().toUpperCase() }
  }, res, () => {
    siguiente = true;
  });

  assert.equal(siguiente, true);
  assert.equal(res.statusCode, 200);
});

test("la propiedad de biblioteca rechaza identificadores inválidos", () => {
  let siguiente = false;
  const res = crearRespuesta();

  propietarioOAdmin({
    usuario: { id: "507f1f77bcf86cd799439012" },
    params: { usuarioId: "no-es-un-objectid" }
  }, res, () => {
    siguiente = true;
  });

  assert.equal(siguiente, false);
  assert.equal(res.statusCode, 400);
});

test("un usuario no puede modificar la reseña de otra persona", async () => {
  const originalFindById = Resena.findById;
  const autorId = new mongoose.Types.ObjectId();
  const otroUsuarioId = new mongoose.Types.ObjectId();
  Resena.findById = async () => ({
    usuarioId: autorId,
    save: async () => {
      assert.fail("No debe guardar una reseña ajena");
    }
  });

  try {
    const res = crearRespuesta();
    await resenaController.actualizarResena({
      params: { id: "507f1f77bcf86cd799439013" },
      usuario: { id: otroUsuarioId.toString() },
      body: { comentario: "Comentario editado" }
    }, res);

    assert.equal(res.statusCode, 403);
  } finally {
    Resena.findById = originalFindById;
  }
});
