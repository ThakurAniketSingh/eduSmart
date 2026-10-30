# eduSmart

**A real-time collaborative programming classroom.**

eduSmart lets an instructor open a temporary classroom and share a short room code.
Students join with just a display name, then everyone can chat, edit Java files
together, draw on a shared whiteboard, and run real Java code — all live, all in
the browser.

Built as an MCA Project-Based Learning (PBL) project.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Backend setup (Windows / macOS / Linux)](#backend-setup)
- [Frontend setup](#frontend-setup)
- [Docker setup (Java code execution)](#docker-setup)
- [Running everything together](#running-everything-together)
- [Application URLs](#application-urls)
- [Troubleshooting](#troubleshooting)
- [Further documentation](#further-documentation)
- [Known limitations](#known-limitations)

---

## Features

- **Create / Join classroom** — instructor creates a room and gets a 6-character
  room code (e.g. `EDU482`); students join with just a display name + that code.
  No login, no passwords.
- **Live presence** — see who is currently connected, in real time, over WebSocket.
- **Real-time chat** — persisted to PostgreSQL, so it's still there if you reload.
- **Multi-file Java workspace** — create, open, rename (via re-save), and delete
  `.java` files per room. Every room starts with a `Main.java`.
- **Collaborative code editing** — powered by Monaco Editor (the engine behind
  VS Code); edits are broadcast over WebSocket to everyone viewing the same file.
- **Java code execution** — click **Run** to compile and execute the active file
  inside an isolated, network-disabled Docker container, with a 5-second timeout.
- **Shared whiteboard** — HTML5 Canvas with pen, eraser, line, rectangle, circle,
  text and clear tools, synced live over WebSocket.
- **Code history** — every explicit **Save** creates a version snapshot you can
  browse and restore later.

## Tech stack

| Layer      | Technology                                                |
|------------|------------------------------------------------------------|
| Frontend   | React + Vite, Tailwind CSS, Monaco Editor, HTML5 Canvas    |
| Backend    | Java 21, Spring Boot, Spring Web, Spring WebSocket, Spring Data JPA / Hibernate |
| Database   | PostgreSQL                                                 |
| Execution  | Docker (isolated, network-disabled Java 21 container)      |

No microservices, no Kafka/Redis, no OAuth, no CRDT — this is deliberately the
simplest working version of each required piece of technology.

## Prerequisites

Install these before you start:

- **Java 21 (JDK)** — [Adoptium Temurin 21](https://adoptium.net/) or any JDK 21 build
- **Apache Maven** (3.9+) — [maven.apache.org](https://maven.apache.org/download.cgi)
  (or use an IDE like IntelliJ IDEA / Eclipse / VS Code + Java extensions, which
  bundle their own Maven support and can run the project without installing
  Maven separately)
- **Node.js 18+** and npm — [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+** — either installed locally, or via Docker (see below)
- **Docker Desktop** — required for the "Run Java" feature. Everything else in
  the app works without Docker; only code execution needs it.

## Project structure

```
eduSmart/
├── backend/                  Spring Boot backend (Java 21)
│   ├── src/main/java/com/edusmart/
│   │   ├── controller/       REST endpoints
│   │   ├── service/          Business logic
│   │   ├── repository/       Spring Data JPA repositories
│   │   ├── entity/           JPA entities (Room, RoomFile, ChatMessage, ...)
│   │   ├── dto/               Request/response objects
│   │   ├── config/           CORS + WebSocket configuration
│   │   ├── websocket/        Room WebSocket handler + message envelope
│   │   ├── exception/        Custom exceptions + @RestControllerAdvice
│   │   └── util/             Room code generator
│   ├── src/test/java/...     Unit + integration tests (H2 in-memory DB)
│   ├── docker/java-runner/   Optional hardened Docker image for code execution
│   └── pom.xml
├── frontend/                 React + Vite frontend
│   └── src/
│       ├── pages/            LandingPage, CreateClassroomPage, JoinClassroomPage, ClassroomPage
│       ├── components/       Navbar, FileExplorer, CodeEditor, ChatPanel, Whiteboard, ...
│       ├── services/         REST API client (axios)
│       ├── websocket/        WebSocket client wrapper
│       ├── hooks/            Toast notifications
│       └── utils/            Constants
├── docs/                     Architecture, database, API, WebSocket, viva & demo docs
├── docker-compose.yml        Local PostgreSQL only
└── .env.example
```

## Environment variables

Two separate env files:

- **`.env.example`** (repo root) — backend variables (`DB_URL`, `DB_USERNAME`,
  `DB_PASSWORD`, `CORS_ALLOWED_ORIGIN`, Docker execution settings). Spring Boot
  reads these as OS environment variables, not from a `.env` file directly —
  export them in your shell/IDE run configuration, or just rely on the
  localhost defaults baked into `application.yml` for local development.
- **`frontend/.env.example`** — copy to `frontend/.env` and adjust if your
  backend runs somewhere other than `localhost:8080`.

```bash
# Windows (PowerShell)
copy frontend\.env.example frontend\.env

# macOS/Linux
cp frontend/.env.example frontend/.env
```

## Database setup

**Option A — Docker (recommended, one command):**

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with database `edusmart`,
user `postgres`, password `postgres` — matching the backend's defaults exactly,
so no further configuration is needed.

**Option B — local PostgreSQL install:**

```sql
CREATE DATABASE edusmart;
```

Then set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` to match your instance (see
`.env.example`).

Tables are created automatically on first backend startup
(`spring.jpa.hibernate.ddl-auto=update`) — there is no separate migration step.

## Backend setup

From the `backend/` folder:

```bash
cd backend

# Windows
mvn spring-boot:run

# macOS/Linux
mvn spring-boot:run
```

This project does not ship a Maven Wrapper binary (`mvnw`/`mvnw.cmd`) because it
was assembled in a sandboxed environment without access to Maven Central to
fetch the wrapper jar. If you'd like one, generate it locally once Maven is
installed:

```bash
mvn -N wrapper:wrapper
```

...after which `mvnw` / `mvnw.cmd spring-boot:run` will also work.

The backend starts on **http://localhost:8080**.

To build a runnable jar instead:

```bash
mvn clean package
java -jar target/edusmart-backend.jar
```

## Frontend setup

From the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

## Docker setup

The **Run** button compiles and executes Java inside a short-lived, isolated
container (`--network=none`, memory/CPU/PID limits, auto-removed afterwards).

1. Install and start **Docker Desktop**.
2. Pull the execution image once:
   ```bash
   docker pull openjdk:21-jdk-slim
   ```
3. That's it — the backend calls `docker run ...` directly; no compose service
   is needed for this part.

If Docker isn't running, **Run** still works end-to-end in the UI — the backend
detects this and returns a clean `DOCKER_UNAVAILABLE` result with the message
*"Docker is not running. Please start Docker Desktop and try again."* instead
of crashing.

An optional hardened image (runs as a non-root user) is provided at
`backend/docker/java-runner/Dockerfile` — see the comments in that file for how
to build and use it instead of the public image.

## Running everything together

1. `docker compose up -d` (PostgreSQL)
2. `docker pull openjdk:21-jdk-slim` (once, for code execution)
3. Terminal 1: `cd backend && mvn spring-boot:run`
4. Terminal 2: `cd frontend && npm install && npm run dev`
5. Open **http://localhost:5173**

## Application URLs

| Service            | URL                             |
|---------------------|----------------------------------|
| Frontend            | http://localhost:5173           |
| Backend REST API    | http://localhost:8080/api       |
| Backend WebSocket   | ws://localhost:8080/ws/room/{roomCode} |
| PostgreSQL          | localhost:5432 (db: `edusmart`) |

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Backend fails to start with a connection refused error | PostgreSQL isn't running — run `docker compose up -d` or start your local instance. |
| Frontend shows network errors calling the API | Backend isn't running on port 8080, or `VITE_API_BASE_URL` in `frontend/.env` doesn't match. |
| CORS error in the browser console | `CORS_ALLOWED_ORIGIN` on the backend doesn't match the frontend's actual origin (default `http://localhost:5173`). |
| WebSocket won't connect / chat & presence don't update | Check `VITE_WS_URL` in `frontend/.env`, and that the backend is reachable. |
| Run button returns "Docker is not running" | Start Docker Desktop, then try again. |
| First run of Run is slow | Docker is pulling `openjdk:21-jdk-slim` the first time; subsequent runs are fast. |
| Port 5432 / 8080 / 5173 already in use | Stop the other process, or change the port in `docker-compose.yml` / `application.yml` / `vite.config.js` respectively. |

## Further documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the pieces fit together, with a diagram
- [`docs/DATABASE.md`](docs/DATABASE.md) — entity relationship overview
- [`docs/API.md`](docs/API.md) — REST endpoint reference
- [`docs/WEBSOCKET.md`](docs/WEBSOCKET.md) — WebSocket event reference
- [`docs/VIVA.md`](docs/VIVA.md) — MCA viva Q&A
- [`docs/DEMO.md`](docs/DEMO.md) — step-by-step demo script

## Known limitations

This is an academic demo project, built simply on purpose:

- No authentication — anyone with a room code can join as a "student"; the
  first person to create the room is trusted as the "instructor" purely by
  convention, with no enforced permissions.
- Collaborative editing broadcasts the whole file on change (debounced), not a
  true CRDT/OT algorithm — two people typing in the exact same spot at the
  exact same moment can occasionally overwrite each other. This is intentional
  (see the project brief) to keep the implementation explainable in a viva.
- Only Java is supported for code execution.
- Live presence is in-memory, so it resets if the backend restarts (chat,
  files, and history are unaffected, since those are persisted in PostgreSQL).
