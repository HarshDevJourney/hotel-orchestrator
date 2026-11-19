import type { HealthReport } from '../api/types';
import { formatDependencyName } from '../utils/format';

interface HealthStatusBarProps {
  report?: HealthReport;
  error?: string;
  loading: boolean;
  onRefresh: () => void;
}

const OVERALL_LABEL: Record<HealthReport['status'], string> = { ok: 'All systems operational', degraded: 'Degraded', down: 'Service down' };

export function HealthStatusBar({ report, error, loading, onRefresh }: HealthStatusBarProps) {
  return (
    <section className="card health" aria-label="System health">
      <div className="health-head">
        {report ? (
          <span className={`pill pill-${report.status}`}>{OVERALL_LABEL[report.status]}</span>
        ) : (
          <span className="pill pill-unknown">{error ? 'Unreachable' : 'Checking…'}</span>
        )}
        <button type="button" className="ghost small" onClick={onRefresh} disabled={loading}>
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {report && (
        <ul className="deps">
          {Object.entries(report.dependencies).map(([name, dependency]) => (
            <li key={name} className={`dep dep-${dependency.status}`} title={dependency.error}>
              <span className="dot" aria-hidden="true" />
              <strong>{formatDependencyName(name)}</strong>
              <span>
                {dependency.status} · {dependency.latencyMs} ms
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && !report && <p className="muted">{error}</p>}
    </section>
  );
}
