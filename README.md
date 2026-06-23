# IBMHackathon2026

Repositorio para el Hackathon IBM Consulting — Junio 2026.

El proyecto es **OfficeSpace**, una aplicación de reserva de espacios de trabajo
construida con una **arquitectura de microservicios dockerizada** (Next.js + 3
microservicios Express + MongoDB). Todo el código está dentro de la carpeta
[`officespace-starter-2026/`](officespace-starter-2026/).

> Toda la aplicación se levanta con **un solo comando** usando Docker. No necesitas
> instalar Node, MongoDB ni dependencias en tu máquina: todo corre en contenedores.

---

## 📦 Requisitos

Solo necesitas Docker. Nada más.

| Requisito          | Versión mínima | Cómo verificar              |
|--------------------|----------------|-----------------------------|
| **Docker Engine**  | 20.10+         | `docker --version`          |
| **Docker Compose** | v2 (plugin)    | `docker compose version`    |
| **Git**            | cualquiera     | `git --version`             |

Además:

- **~2 GB de RAM libre** y **~2 GB de disco** para las imágenes.
- Los puertos **3000, 4000, 4001, 4002 y 27017** deben estar **libres**
  (son los que publica la app; ver tabla más abajo).

> 💡 En Windows/Mac, instala **Docker Desktop** (ya incluye Docker Engine + Compose).
> En Linux, instala `docker` y el plugin `docker-compose-plugin`.

---

## 🚀 Cómo levantar el proyecto (Docker)

```bash
# 1. Clona el repositorio
git clone git@github.com:alnuxE/IBMHackathon2026.git
cd IBMHackathon2026/officespace-starter-2026

# 2. Crea tu archivo de variables de entorno
cp .env.example .env
#    (opcional) edita .env y pon tu propio JWT_SECRET

# 3. Levanta TODO (construye las imágenes la primera vez)
docker compose up --build
#    Para correrlo en segundo plano:  docker compose up -d --build
```

La primera vez tarda unos minutos (descarga MongoDB y compila el frontend).
Cuando todos los contenedores estén arriba, abre 👉 **http://localhost:3000**

La base de datos se inicializa automáticamente con datos de ejemplo
(usuarios, espacios y reservas) mediante `shared-infra/init-mongo.js`.

---

## 🌐 Servicios y puertos

| Servicio          | URL local                     | Puerto | Rol                              |
|-------------------|-------------------------------|--------|----------------------------------|
| **frontend**      | http://localhost:3000         | 3000   | Interfaz web (Next.js + React)   |
| **auth-service**  | http://localhost:4000         | 4000   | Registro/login, emite JWT        |
| **catalog-service** | http://localhost:4001       | 4001   | Catálogo de espacios             |
| **booking-service** | http://localhost:4002       | 4002   | Reservas                         |
| **mongo**         | localhost:27017               | 27017  | Base de datos compartida         |

Cada microservicio expone su documentación interactiva (Swagger) en `/api-docs`,
por ejemplo: http://localhost:4000/api-docs

---

## 👤 Usuarios precargados

No hay registro abierto: los usuarios vienen del seeder. Usa estas credenciales
para iniciar sesión:

| Usuario                                | Contraseña | Rol           |
|----------------------------------------|------------|---------------|
| `admin@corporativoalpha.com`           | `Admin123` | ADMINISTRADOR |
| `carlos.mendez@corporativoalpha.com`   | `User123`  | COLABORADOR   |
| `ana.torres@corporativoalpha.com`      | `User123`  | COLABORADOR   |

---

## 🛠️ Comandos útiles

> Ejecútalos dentro de `officespace-starter-2026/`.

```bash
docker compose ps                      # ver estado de los contenedores
docker compose logs -f                 # ver logs de todos (Ctrl+C para salir)
docker compose logs -f booking-service # ver logs de un servicio
docker compose up -d --build           # reconstruir y levantar en segundo plano
docker compose restart frontend        # reiniciar un solo servicio
docker compose down                    # parar y eliminar contenedores (conserva la BD)
docker compose down -v                 # parar y BORRAR también la base de datos
```

---

## 🩺 Solución de problemas

- **Un puerto está ocupado** (`port is already allocated`): libera el puerto o
  detén lo que lo esté usando. Verifica con `docker compose ps` y `docker ps`.
- **La app no carga / cambios no se reflejan**: reconstruye con
  `docker compose up -d --build`.
- **Quiero empezar de cero** (resetear la base de datos):
  `docker compose down -v && docker compose up --build`.

---

## 📚 Más documentación

Detalles de arquitectura, contratos de API y esquema de la base de datos están en
la carpeta del proyecto:

- [`officespace-starter-2026/README.md`](officespace-starter-2026/README.md) — guía completa del proyecto
- [`officespace-starter-2026/docs/ARCHITECTURE.md`](officespace-starter-2026/docs/ARCHITECTURE.md) — decisiones técnicas
- [`officespace-starter-2026/docs/API_CONTRACT.md`](officespace-starter-2026/docs/API_CONTRACT.md) — contrato de endpoints
- [`officespace-starter-2026/shared-infra/SCHEMA.md`](officespace-starter-2026/shared-infra/SCHEMA.md) — esquema de datos
