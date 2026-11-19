# Hotel Offer Orchestrator

Aggregates overlapping hotel offers from two mocked suppliers, de-duplicates hotels by name, keeps the **cheapest offer per hotel**, stores the result in **Redis**, and filters by price range **inside Redis**. A **Temporal** workflow orchestrates the comparison. A **React** frontend lets you search, see live health and simulate supplier outages.

```
.
├── backend/               Node.js + TypeScript + Express + Temporal + Redis (SOLID, ports and adapters)
│   ├── src/ tests/ postman/
│   ├── Dockerfile
│   └── README.md          full backend docs: class diagrams, SOLID mapping, API, Redis model
├── frontend/              React + TypeScript + Vite, served by nginx in Docker
│   ├── src/ tests/
│   ├── Dockerfile
│   └── README.md          frontend docs
└── docker-compose.yml     runs everything: redis, temporal, api, worker, frontend
```

## Quick start

```bash
docker compose up --build
```

Wait about 30 to 60 seconds on the first start (Temporal boots; the API and worker retry until it is ready).

| What | URL |
|---|---|
| **Frontend (UI)** | http://localhost:8080 |
| API | http://localhost:3000/api/hotels?city=delhi |
| Health | http://localhost:3000/health |
| Temporal Web UI (watch workflows) | http://localhost:8233 |

```bash
curl "http://localhost:3000/api/hotels?city=delhi"
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=6000"
```

Stop everything with `docker compose down`.

| Service | Built from | Purpose | Port |
|---|---|---|---|
| `frontend` | `./frontend` | UI, plus reverse proxy to the API | 8080 |
| `api` | `./backend` | REST API + mock suppliers | 3000 |
| `worker` | `./backend` | Temporal worker (workflow + activities) | n/a |
| `temporal` | image | Temporal dev server | 7233 / 8233 |
| `redis` | image | hotel store + price index | 6379 |

## How it works

1. The UI (or any client) calls `GET /api/hotels?city=delhi[&minPrice=&maxPrice=]`.
2. The API starts a Temporal workflow. The workflow calls Supplier A and B **in parallel**, picks the **cheapest offer per hotel** (names matched case-insensitively), **saves the list in Redis** and, if a range was given, lets **Redis filter by price** (sorted set + `ZRANGEBYSCORE`).
3. One supplier down still returns the other's hotels; both down returns `502`.
4. `GET /health` reports Supplier A, Supplier B and Redis.

Details, class diagrams (LLD), SOLID mapping and extension guides: [backend/README.md](backend/README.md). UI details: [frontend/README.md](frontend/README.md).

## Testing

| Layer | Command | What it covers |
|---|---|---|
| Backend unit tests | `cd backend && npm install && npm test` | 31 tests with fakes for every port (no Redis or Temporal needed) |
| Frontend unit tests | `cd frontend && npm install && npm test` | 17 tests: API client, validation, sorting, formatting |
| API end to end | import `backend/postman/hotel-offer-orchestrator.postman_collection.json` (or `npx newman run <file>`) | overlaps, price filters, no-result city, validation, health, supplier outage |
| Manual, in the UI | open http://localhost:8080 | see the table in [frontend/README.md](frontend/README.md#try-these-in-the-ui) |

## Local development without Docker for the apps

```bash
docker compose up redis temporal      # infrastructure only
cd backend  && npm install && npm run dev:api      # terminal 1
cd backend  && npm run dev:worker                  # terminal 2
cd frontend && npm install && npm run dev          # terminal 3 -> http://localhost:5173
```

## Requirements

Docker with Compose v2, or (for local development) Node.js 20+.
