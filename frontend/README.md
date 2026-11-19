# Hotel Offer Orchestrator: Frontend

A small React + TypeScript single-page app for the hotel offer API. It shows the best price per hotel across suppliers, lets you filter by price range (executed in Redis by the backend), shows live system health, and can simulate supplier outages for demos.

**Stack:** React 18 · TypeScript · Vite · Vitest · nginx (in Docker)

## Features

| Feature | Details |
|---|---|
| Search | City plus optional min/max price. Client-side validation mirrors the backend rules |
| Results | Table with hotel, best price (₹), supplier badge and commission. Click a header to sort |
| States | Loading, empty ("No hotels found…"), and error (shows the backend error code and message, e.g. `SUPPLIERS_UNAVAILABLE`) |
| Health | Polls `GET /health` every 15 s: overall status (ok / degraded / down) and every dependency with latency |
| Demo controls | "Take Supplier A/B down" and "Restore" buttons call `PUT /supplier<ID>/status` on the mock suppliers |
| Look and feel | Responsive layout, light and dark mode, keyboard-accessible, `aria-live` results |

## Run it

**With Docker (whole system), from the repository root**

```bash
docker compose up --build
# UI:  http://localhost:8080
```

nginx serves the built app and proxies `/api`, `/health` and `/supplier*` to the backend, so the browser talks to one origin and no CORS setup is needed. The backend URL is set by `BACKEND_URL` (default `http://api:3000`).

**Local development** (needs the backend running on `localhost:3000`)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, API calls are proxied to the backend
```

Use another backend with `VITE_BACKEND_URL=http://host:port npm run dev`.

**Other scripts**

```bash
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ on :4173 with the same proxy
npm run typecheck
npm test             # unit tests (Vitest)
```

## Structure

```
src/
├── api/
│   ├── HotelApi.ts          HotelApi interface, ApiError, HttpHotelApi (fetch implementation)
│   └── types.ts             HotelOffer, SearchParams, HealthReport, ...
├── hooks/
│   ├── useHotelSearch.ts    search state machine (idle / loading / success / error), cancels stale requests
│   └── useHealth.ts         polling health state + manual refresh
├── components/
│   ├── SearchForm.tsx       inputs + validation messages
│   ├── HotelTable.tsx       sortable results
│   ├── HealthStatusBar.tsx  overall status + dependencies
│   └── SupplierControls.tsx demo outage toggles
├── utils/
│   ├── validateSearch.ts    form validation (pure)
│   ├── sortHotels.ts        sorting (pure)
│   └── format.ts            price and name formatting
├── App.tsx                  composition root: creates HttpHotelApi, wires hooks and components
├── main.tsx · styles.css
tests/                       Vitest unit tests
Dockerfile · nginx.conf.template
```

## Design notes

The same principles as the backend apply on a smaller scale:

- **Dependency inversion:** hooks and components depend on the `HotelApi` interface; only `App.tsx` chooses `HttpHotelApi`. Tests inject a fake `fetch`.
- **Single responsibility:** components render, hooks manage async state, `utils` hold pure logic, `api` owns HTTP details and error mapping.
- **Predictable errors:** the API client converts every failure into `ApiError` (`status`, `code`, `message`), including network failures (`NETWORK_ERROR`). A `503` from `/health` is treated as a valid "down" report, not a failure.
- **Race safety:** a new search aborts the previous request, so a slow old response can never overwrite a newer one.

## Tests

`npm test` runs 17 tests covering the API client (query building, error mapping, network errors, 503 health reports, supplier toggle), form validation, sorting and formatting.

## Try these in the UI

| Do this | You should see |
|---|---|
| Open the page | Delhi results load automatically; Holtin is ₹5,340 from Supplier B, Radison ₹5,900 from Supplier A |
| Min 5000, max 6000, Search | Holtin and Radison only |
| City `atlantis` | "No hotels found for “atlantis”." |
| Min 9000, max 1000 | inline validation error, no request sent |
| Demo controls: take Supplier B down, Search | only Supplier A offers; health pill turns **Degraded** |
| Take Supplier A down too, Search | error `SUPPLIERS_UNAVAILABLE`; health pill turns **Service down** |
| Restore both | everything back to normal |
