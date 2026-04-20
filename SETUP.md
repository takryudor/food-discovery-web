# FoOdyssey Setup Guide (Linux, macOS, Windows)

This guide matches the current workflow in this repository:

- Frontend runs with Next.js in `frontend/src/app`
- Backend runs with FastAPI and serves Swagger docs
- PostgreSQL is included in Docker Compose for local development
- Redis is deferred until after MVP

## 1) Prerequisites

### Linux

- Install Docker Engine + Docker Compose plugin
- Install Node.js 20+ and npm

Example (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out/in after adding Docker group.

### macOS

- Install Docker Desktop
- Install Node.js 20+ (Homebrew recommended)

```bash
brew install node
```

### Windows

- Install Docker Desktop (WSL2 backend recommended)
- Install Node.js 20+ (official installer)
- Use PowerShell, Git Bash, or WSL terminal

## 2) Verify Tooling

Run these commands in terminal:

```bash
docker --version
docker compose version
node -v
npm -v
```

If `docker-compose` fails with command not found, use `docker compose` (new syntax).

## 3) Repo Setup

From repo root, create environment files:

Linux/macOS:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

Edit `frontend/.env` if backend API URL is not `http://localhost:8000`.

## 4) Quick Start (Recommended for all OS)

From repo root:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:8000/docs
- Backend ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

Stop services:

```bash
docker compose down
```

Reset services and remove volumes (including DB data):

```bash
docker compose down -v
```

## 5) Alternative Run Options

### Option A: Run frontend with local Node (fastest for FE dev)

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

### Option B: Run frontend with Docker Compose

From repo root:

```bash
docker compose up frontend
```

Open: http://localhost:3000

### Option C: Run backend only with Docker Compose

From repo root:

```bash
docker compose up --build backend postgres
```

Open backend docs:

- http://localhost:8000/docs

### Option D: Run backend locally (without Docker)

From repo root:

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Open backend docs:

- http://localhost:8000/docs

## 6) PostgreSQL for local dev

Start DB only:

```bash
docker compose up -d postgres
```

Default connection values, use in Adminer as well:

- Host: localhost
- Port: 5432
- Server: postgre
- Database: foodyssey
- User: foodyssey
- Password: foodyssey

## 7) Development Workflow: run <-> edit code <-> verify

Recommended loop:

1. Start services:

```bash
docker compose up --build
```

2. Edit code:

- Frontend code in `frontend/src`
- Backend code in `backend/app`

3. Verify quickly after each edit:

- Frontend page: http://localhost:3000
- Backend health: http://localhost:8000/health
- Backend docs: http://localhost:8000/docs

4. Run backend tests when changing backend logic:

```bash
cd backend
pytest
```

5. Stop when done:

```bash
docker compose down
```

Current backend scaffold is still mostly structure-only beyond the bootstrap:

- `backend/app/api/v1/*_routes.py` files are placeholders for future endpoints.
- `backend/app/modules/*` follows the module breakdown in README.
- Each module keeps `models.py` and `schemas.py` as single files per module.
- `backend/tests/unit` and `backend/tests/integration` are placeholder test files.

## 8) Frontend Structure (now)

```text
frontend/
  src/
    app/
    components/
    hooks/
    lib/
    store/
```

Main page entry is now:

- `frontend/src/app/page.tsx`

## 9) Quick Troubleshooting

- Port 3000 already in use: stop old process or change exposed port in `docker-compose.yml`.
- Docker permission denied on Linux: ensure user is in `docker` group and re-login.
- Node modules conflict in container: keep `frontend_node_modules` named volume as-is.
- FE cannot call backend: check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env`.
- On Windows, prefer PowerShell or WSL; if file permission/watch issues appear, run Docker Desktop with WSL2 integration enabled.
