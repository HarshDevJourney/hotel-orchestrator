import { useCallback, useEffect, useRef, useState } from 'react';
import type { HotelApi } from '../api/HotelApi';
import type { HealthReport } from '../api/types';

interface HealthState {
  report?: HealthReport;
  error?: string;
  loading: boolean;
}

/** Polls GET /health so the UI always shows the live state of suppliers and Redis. */
export function useHealth(api: HotelApi, intervalMs = 15000) {
  const [state, setState] = useState<HealthState>({ loading: true });
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((previous) => ({ ...previous, loading: true }));
    try {
      const report = await api.getHealth(controller.signal);
      if (!controller.signal.aborted) setState({ report, loading: false });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ error: (error as Error).message, loading: false });
    }
  }, [api]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), intervalMs);
    return () => {
      clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { ...state, refresh };
}
