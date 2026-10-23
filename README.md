# 🎮 GameTeca

**GameTeca** es una aplicación web para explorar un catálogo de videojuegos, gestionar una biblioteca personal y compartir reseñas y puntuaciones. Se desarrolló como proyecto académico de bases de datos no relacionales, utilizando **MongoDB**, **Node.js/Express** y **React**.

## ✨ Funcionalidades

- **Catálogo público:** consulta de videojuegos, búsqueda y filtros.
- **Detalle de videojuegos:** información del juego, reseñas y valoración promedio.
- **Autenticación:** registro de jugadores, inicio de sesión y acceso mediante JWT.
- **Biblioteca personal:** agregar y quitar videojuegos, consultar la colección y actualizar el estado de progreso.
- **Reseñas:** publicar, consultar, editar las propias y eliminarlas según permisos.
- **Administración:** crear y editar videojuegos, desactivarlos y reactivarlos.
- **Integridad de datos:** eliminación lógica de videojuegos para conservar el historial de bibliotecas y reseñas. Los juegos inactivos se excluyen del catálogo público y no admiten nuevas incorporaciones ni reseñas.
- **Interfaz adaptable:** frontend con React y Vite para escritorio y dispositivos móviles.

## 🛠️ Tecnologías

| Componente | Tecnología |
| --- | --- |
| Base de datos | MongoDB |
| Backend | Node.js, Express, Mongoose |
| Seguridad | bcrypt, JWT, Helmet, express-rate-limit, CORS |
| Frontend | React, Vite, React Router, Lucide React |
| Pruebas | Node.js Test Runner (`node --test`) |

## 📁 Estructura del proyecto

```text
GameTeca/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── vite.config.js
│   └── package.json
└── README.md
```

> MongoDB se ejecuta como un servicio/proceso separado; sus binarios y datos no forman parte del repositorio.

## 📋 Requisitos

- Node.js y npm instalados.
- MongoDB disponible localmente.
- Una instancia de MongoDB configurada como **replica set** (`rs0` en el entorno de desarrollo), necesaria para las transacciones utilizadas por el registro de usuarios.

## 🚀 Instalación y ejecución local

### 1. Obtener el proyecto

```bash
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
cd TU-REPOSITORIO
```

Reemplaza la URL y el nombre de carpeta por los de tu repositorio.

### 2. Iniciar MongoDB

En Windows, si utilizas la versión portable, abre una terminal en la carpeta que contiene `bin` y `data` y ejecuta:

```cmd
bin\mongod.exe --dbpath ".\data" --replSet rs0 --bind_ip 127.0.0.1 --port 27017
```

**Solo la primera vez**, si el replica set todavía no fue inicializado, abre otra terminal con `mongosh` y ejecuta:

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})
```

No repitas `rs.initiate()` en una instancia que ya está configurada.

### 3. Configurar e iniciar el backend

```bash
cd backend
npm ci
```

Crea el archivo `backend/.env` con esta estructura y reemplaza la clave de ejemplo por una clave privada aleatoria de al menos 32 caracteres:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/gameteca?replicaSet=rs0
PORT=3000
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
```

Inicia la API:

```bash
node server.js
```

API local: **http://127.0.0.1:3000**

### 4. Configurar e iniciar el frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
npm ci
```

El frontend incluye `frontend/.env.example`. Si necesitas definir explícitamente la dirección de la API, crea `frontend/.env` con:

```dotenv
VITE_API_URL=http://127.0.0.1:3000
```

Ejecuta:

```bash
npm run dev
```

Abre **http://localhost:5173** en el navegador.

> El backend permite solicitudes CORS desde `http://localhost:5173`. Si cambias el origen del frontend, tendrás que ajustar esa configuración.

## 👤 Roles y permisos

| Funcionalidad | Visitante | Jugador | Administrador |
| --- | :---: | :---: | :---: |
| Consultar catálogo y reseñas | ✅ | ✅ | ✅ |
| Gestionar biblioteca propia | ❌ | ✅ | ✅ |
| Publicar reseñas | ❌ | ✅ | ✅ |
| Editar reseñas propias | ❌ | ✅ | ✅ |
| Administrar videojuegos | ❌ | ❌ | ✅ |
| Consultar y reactivar inactivos | ❌ | ❌ | ✅ |

El registro público asigna el rol **jugador**. Para crear un administrador local, desde `backend/`, ejecuta:

```bash
node scripts/crearAdmin.js
```

El script solicita nombre, correo y contraseña de manera interactiva. **No incluyas credenciales de demostración en el repositorio.**

## 🔌 API REST principal

| Método | Ruta | Función |
| --- | --- | --- |
| `POST` | `/api/auth/registro` | Registrar jugador |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `GET` | `/api/auth/perfil` | Consultar perfil autenticado |
| `GET` | `/api/videojuegos` | Listar y filtrar videojuegos activos |
| `GET` | `/api/videojuegos/:id` | Consultar videojuego activo |
| `POST` | `/api/videojuegos` | Crear videojuego (admin) |
| `PUT` | `/api/videojuegos/:id` | Editar videojuego (admin) |
| `DELETE` | `/api/videojuegos/:id` | Desactivar videojuego (admin) |
| `GET` | `/api/videojuegos/inactivos` | Listar inactivos (admin) |
| `PATCH` | `/api/videojuegos/:id/reactivar` | Reactivar videojuego (admin) |
| `GET` | `/api/bibliotecas/:usuarioId` | Consultar biblioteca autorizada |
| `POST` | `/api/bibliotecas/:usuarioId/juegos` | Agregar juego a biblioteca |
| `PATCH` | `/api/bibliotecas/:usuarioId/juegos/:videojuegoId` | Actualizar estado de juego |
| `DELETE` | `/api/bibliotecas/:usuarioId/juegos/:videojuegoId` | Quitar juego |
| `GET` | `/api/resenas/videojuego/:videojuegoId` | Consultar reseñas |
| `POST` | `/api/resenas` | Crear reseña |
| `PUT` | `/api/resenas/:id` | Editar reseña propia |
| `DELETE` | `/api/resenas/:id` | Eliminar reseña autorizada |

Las rutas protegidas requieren `Authorization: Bearer <token>` y, según el caso, permisos adicionales.

## 🧪 Pruebas

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

Además de las pruebas automatizadas, se recomienda comprobar manualmente el flujo completo: registro, login, catálogo, biblioteca, reseñas y administración, con MongoDB en ejecución.

## 🔐 Seguridad y publicación en GitHub

- **No publiques** archivos `.env`, secretos JWT, contraseñas ni datos privados.
- Excluye `node_modules/`, `dist/` y carpetas de datos de MongoDB del control de versiones.
- Conserva los archivos `package-lock.json` para permitir instalaciones reproducibles con `npm ci`.
- No subas respaldos de bases de datos que contengan información personal.
- La configuración actual está orientada a **desarrollo local**, no a un despliegue público de producción.

Ejemplo recomendado de `.gitignore` en la raíz:

```gitignore
**/node_modules/
**/.env
**/.env.*
!**/.env.example
**/dist/
**/coverage/
**/*.log
mongodb-win32-x86_64-windows-*/data/
```

## 📌 Estado del proyecto

Los módulos principales del backend y frontend están implementados. Antes de la presentación final se recomienda validar de extremo a extremo la aplicación, incluida la eliminación lógica, la reactivación y la persistencia de datos tras reiniciar los servicios.

---

**GameTeca** · Proyecto académico de MongoDB y desarrollo web.
