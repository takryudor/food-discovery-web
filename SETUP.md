# FoOdyssey Setup Guide (Linux, macOS, Windows)

This guide is for the current repo state:

- Frontend is active and moved to `frontend/src/app`
- Backend is scaffolded as directory/module skeleton only (no API implementation yet)
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

From repo root:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` if backend API URL is not `http://localhost:8000`.

## 4) Frontend Run Options

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

## 5) Optional Local PostgreSQL (for future backend work)

PostgreSQL service is included but disabled by default via profile `db`.

Start DB only:

```bash
docker compose --profile db up -d postgres
```

Default connection values:

- Host: localhost
- Port: 5432
- Database: foodyssey
- User: foodyssey
- Password: foodyssey

Stop all compose services:

```bash
docker compose down
```

Stop and remove volumes (including DB data):

```bash
docker compose down -v
```

## 6) Backend Run + Swagger

Backend now has a minimal FastAPI bootstrap, so you can open Swagger without waiting for business logic.

Run it locally from repo root:

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- http://localhost:8000/docs
- http://localhost:8000/redoc
- http://localhost:8000/api/v1/health

Current backend scaffold is still mostly structure-only beyond the bootstrap:

- `backend/app/api/v1/*_routes.py` files are placeholders for future endpoints.
- `backend/app/modules/*` follows the module breakdown in README.
- Each module keeps `models.py` and `schemas.py` as single files per module.
- `backend/tests/unit` and `backend/tests/integration` are placeholder test files.

## 7) Frontend Structure (now)

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

## 8) Quick Troubleshooting

- Port 3000 already in use: stop old process or change exposed port in `docker-compose.yml`.
- Docker permission denied on Linux: ensure user is in `docker` group and re-login.
- Node modules conflict in container: keep `frontend_node_modules` named volume as-is.
- FE cannot call backend: check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env`.
