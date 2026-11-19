import { useState } from 'react';
import type { HotelApi } from '../api/HotelApi';
import type { HealthReport } from '../api/types';
import { formatDependencyName } from '../utils/format';

interface SupplierControlsProps {
  api: HotelApi;
  report?: HealthReport;
  onChanged: () => void;
}

/** Demo helper: simulate a supplier outage through the mock supplier API (PUT /supplier<ID>/status). */
export function SupplierControls({ api, report, onChanged }: SupplierControlsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suppliers = Object.entries(report?.dependencies ?? {})
    .filter(([name]) => name.startsWith('supplier'))
    .map(([name, dependency]) => ({ id: name.slice('supplier'.length), name, isDown: dependency.status === 'down' }));

  const toggle = async (id: string, down: boolean) => {
    setPending(id);
    setError(null);
    try {
      await api.setSupplierDown(id, down);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <details className="card demo">
      <summary>Demo controls: simulate supplier outage</summary>
      <p className="muted">
        Take a mock supplier down, then search again. One supplier down still returns the other’s hotels; both down returns an error.
      </p>
      {suppliers.length === 0 && <p className="muted">Health data is not available yet.</p>}
      <div className="demo-buttons">
        {suppliers.map(({ id, name, isDown }) => (
          <button key={id} type="button" className={isDown ? 'primary' : 'danger'} disabled={pending === id} onClick={() => toggle(id, !isDown)}>
            {isDown ? `Restore ${formatDependencyName(name)}` : `Take ${formatDependencyName(name)} down`}
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </details>
  );
}
