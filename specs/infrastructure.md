# Infrastructure

## Overview
Clockwise is containerized with Docker. The stack consists of a React SPA (served by nginx), a NestJS API server, and a PostgreSQL database.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    nginx    │────▶│   NestJS    │
│  (React SPA)│     │ (static +   │     │   API       │
│             │     │  reverse    │     │             │
│             │     │  proxy)     │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │ PostgreSQL  │
                                        │             │
                                        └─────────────┘
```

- **nginx** serves the React SPA static files and proxies `/api/*` requests to the NestJS backend.
- **NestJS** handles all business logic, authentication, and database access.
- **PostgreSQL** stores all application data.

---

## Docker Services

### docker-compose.yml

| Service | Image / Build | Port | Description |
|---------|--------------|------|-------------|
| `frontend` | Build from `./frontend` | 80 (nginx) | React SPA + nginx reverse proxy |
| `backend` | Build from `./backend` | 3000 (internal) | NestJS API server |
| `db` | `postgres:16` | 5432 (internal) | PostgreSQL database |
| `redis` | `redis:7-alpine` | 6379 (internal) | Redis for BullMQ job queue |

### Frontend Container
- **Build**: Multi-stage Dockerfile
  - Stage 1: `node:20-alpine` — install deps, build React app (`npm run build`)
  - Stage 2: `nginx:alpine` — copy built files + nginx config
- **nginx config**: Serve static files, proxy `/api` to backend, SPA fallback (all routes → `index.html`)

### Backend Container
- **Build**: Multi-stage Dockerfile
  - Stage 1: `node:20-alpine` — install deps, build NestJS (`npm run build`)
  - Stage 2: `node:20-alpine` — copy dist + production deps, run `node dist/main.js`
- **Health check**: `GET /api/v1/health`

### Database
- Official `postgres:16` image
- Data persisted via named Docker volume
- Initialization via NestJS migrations (TypeORM or Prisma)

---

## Environment Variables

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/clockwise` |
| `JWT_SECRET` | Secret for signing JWTs | (random 256-bit key) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | (random 256-bit key) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost/api/v1/auth/google/callback` |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost` |
| `NODE_ENV` | Environment | `development` / `production` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |

### Frontend (build-time)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API base URL | `/api/v1` (relative, proxied by nginx) |

---

## Project Structure

```
clockwise/
├── specs/                    # Application specifications
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── teams/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── time-logs/
│   │   │   ├── reports/
│   │   │   └── org/
│   │   ├── common/           # Guards, decorators, interceptors
│   │   ├── database/         # Migrations, entities
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── docker-compose.dev.yml    # Dev overrides (hot reload, exposed ports)
└── .env.example
```

---

## Development Setup

### docker-compose.dev.yml overrides
- Frontend: Vite dev server with hot reload (port 5173) instead of nginx
- Backend: `npm run start:dev` with file watching
- Database: Exposed on `localhost:5432` for direct access
- Volumes: Mount source code for live reloading

### Local Development Flow
1. `cp .env.example .env` and fill in values
2. `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
3. Frontend available at `http://localhost:5173`
4. Backend available at `http://localhost:3000`
5. Database at `localhost:5432`

---

## Database Migrations
- Managed via the NestJS ORM (TypeORM or Prisma — to be decided at implementation).
- Migrations run automatically on backend startup in development.
- In production, migrations run as a separate step before deploying the new backend version.
