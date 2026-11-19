import { useCallback, useEffect, useRef, useState } from 'react';
import type { HotelApi } from '../api/HotelApi';
import { ApiError } from '../api/HotelApi';
import type { HotelOffer, SearchParams } from '../api/types';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; hotels: HotelOffer[]; params: SearchParams; tookMs: number }
  | { status: 'error'; message: string; code?: string };

export function useHotelSearch(api: HotelApi) {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(
    async (params: SearchParams) => {
      controllerRef.current?.abort(); // a newer search supersedes the previous one
      const controller = new AbortController();
      controllerRef.current = controller;

      setState({ status: 'loading' });
      const startedAt = performance.now();
      try {
        const hotels = await api.searchHotels(params, controller.signal);
        if (!controller.signal.aborted) {
          setState({ status: 'success', hotels, params, tookMs: Math.round(performance.now() - startedAt) });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const apiError = error instanceof ApiError ? error : undefined;
        setState({
          status: 'error',
          message: apiError?.message ?? 'Something went wrong',
          code: apiError?.code,
        });
      }
    },
    [api],
  );

  return { state, search };
}
