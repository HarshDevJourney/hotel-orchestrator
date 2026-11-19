import { useEffect } from 'react';
import { HttpHotelApi } from './api/HotelApi';
import { HealthStatusBar } from './components/HealthStatusBar';
import { HotelTable } from './components/HotelTable';
import { SearchForm } from './components/SearchForm';
import { SupplierControls } from './components/SupplierControls';
import { useHealth } from './hooks/useHealth';
import { useHotelSearch } from './hooks/useHotelSearch';
import { formatPrice } from './utils/format';

// Composition root of the UI: the only place that picks the concrete API implementation.
const api = new HttpHotelApi();

export default function App() {
  const { state, search } = useHotelSearch(api);
  const health = useHealth(api);

  useEffect(() => {
    void search({ city: 'delhi' }); // show data immediately
  }, [search]);

  return (
    <main className="container">
      <header>
        <h1>Hotel Offer Orchestrator</h1>
        <p className="muted">Best price per hotel across suppliers, de-duplicated by name. Price filtering runs inside Redis.</p>
      </header>

      <HealthStatusBar report={health.report} error={health.error} loading={health.loading} onRefresh={health.refresh} />
      <SearchForm loading={state.status === 'loading'} onSearch={search} />

      <section className="card results" aria-live="polite">
        {state.status === 'idle' && <p className="muted">Search for a city to see offers.</p>}
        {state.status === 'loading' && <p className="muted">Asking suppliers…</p>}

        {state.status === 'error' && (
          <div className="alert" role="alert">
            <strong>{state.code ? `${state.code}: ` : ''}</strong>
            {state.message}
          </div>
        )}

        {state.status === 'success' && state.hotels.length === 0 && (
          <p className="muted">No hotels found for “{state.params.city}”{state.params.minPrice !== undefined || state.params.maxPrice !== undefined ? ' in this price range' : ''}.</p>
        )}

        {state.status === 'success' && state.hotels.length > 0 && (
          <>
            <div className="summary">
              <span>
                <strong>{state.hotels.length}</strong> hotels in <strong>{state.params.city}</strong>
              </span>
              <span>
                Cheapest <strong>{formatPrice(Math.min(...state.hotels.map((hotel) => hotel.price)))}</strong>
              </span>
              <span className="muted">{state.tookMs} ms</span>
            </div>
            <HotelTable hotels={state.hotels} />
          </>
        )}
      </section>

      <SupplierControls api={api} report={health.report} onChanged={health.refresh} />
    </main>
  );
}
