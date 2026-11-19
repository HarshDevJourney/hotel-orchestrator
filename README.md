# Hotel Offer Orchestrator

Hotel Offer Orchestrator combines offers from two mocked hotel suppliers, removes duplicate hotels, keeps the **cheapest offer for each hotel**, stores the results in **Redis**, and supports price filtering in Redis. A **Temporal** workflow coordinates the supplier requests and processing.

The project includes a React frontend for searching hotels, viewing service health, and simulating supplier outages.

## Project structure

```text
.
├── backend/               Node.js + TypeScript + Express + Temporal + Redis
│   ├── src/
│   ├── tests/
│   └── README.md          Backend architecture and API documentation
├── frontend/              React + TypeScript + Vite
│   ├── src/
│   └── README.md          Frontend documentation
└── docker-compose.yml     Runs Redis, Temporal, the API, worker, and frontend
```

## Run the project with Docker

### Step 1: Install the prerequisites

Install the following software:

- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Make sure Docker Desktop is running before starting the application.

### Step 2: Clone the repository

Replace `<repository-url>` with the URL of this GitHub repository:

```bash
git clone <repository-url>
cd hotel-offer-orchestrator
```

### Step 3: Build and start the application

Run this command from the project root, where `docker-compose.yml` is located:

```bash
docker compose up --build
```

The first startup can take 30–60 seconds while Docker builds the images and Temporal starts. The API and worker retry their connections while the infrastructure becomes ready.

### Step 4: Open the application

Once the containers are running, open the frontend:

**http://localhost:8080**

Available services:

| Service | URL | Description |
|---|---|---|
| Frontend | http://localhost:8080 | Hotel search interface |
| API | http://localhost:3000 | REST API |
| Health | http://localhost:3000/health | API, supplier, and Redis status |
| Temporal Web UI | http://localhost:8233 | View Temporal workflows |
| Redis | localhost:6379 | Hotel data store |

### Step 5: Try the API

Search for hotels in a city:

```bash
curl "http://localhost:3000/api/hotels?city=delhi"
```

Search with a price range:

```bash
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=6000"
```

Check service health:

```bash
curl "http://localhost:3000/health"
```

### Step 6: Stop the application

Press `Ctrl+C` in the terminal running Docker Compose, then run:

```bash
docker compose down
```

To stop the containers and remove their volumes:

```bash
docker compose down -v
```

## Run locally without Docker for the applications

Docker is still required for Redis and Temporal. Start only those infrastructure services first:

```bash
docker compose up redis temporal
```

Open three additional terminals from the project root.

### Terminal 1: Start the backend API

```bash
cd backend
npm install
npm run dev:api
```

### Terminal 2: Start the Temporal worker

```bash
cd backend
npm run dev:worker
```

### Terminal 3: Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend development server at **http://localhost:5173**.

## How it works

1. The frontend or another client calls `GET /api/hotels?city=delhi`.
2. The API starts a Temporal workflow.
3. The workflow calls Supplier A and Supplier B in parallel.
4. Offers are matched by hotel name, case-insensitively.
5. The cheapest offer for each hotel is saved in Redis.
6. If a price range is provided, Redis filters the results using its sorted-set price index.
7. If one supplier is unavailable, the other supplier's results are returned. If both are unavailable, the API returns `502`.

## Services

| Service | Built from | Purpose | Port |
|---|---|---|---|
| `frontend` | `./frontend` | React UI and reverse proxy to the API | 8080 |
| `api` | `./backend` | REST API and mocked suppliers | 3000 |
| `worker` | `./backend` | Temporal workflow and activities | - |
| `temporal` | Docker image | Temporal development server | 7233, 8233 |
| `redis` | Docker image | Hotel store and price index | 6379 |

## More documentation

- [Backend documentation](backend/README.md): architecture, API reference, Redis model, and configuration
- [Frontend documentation](frontend/README.md): UI structure and frontend details

## Requirements

- Docker Desktop with Docker Compose v2
- Node.js 20 or newer for local application development
