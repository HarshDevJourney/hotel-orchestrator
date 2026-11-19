import type { HealthReport, HotelOffer, SearchParams, SupplierStatus } from './types';

/** What the UI needs from the backend. Components and hooks depend on this, not on fetch. */
export interface HotelApi {
  searchHotels(params: SearchParams, signal?: AbortSignal): Promise<HotelOffer[]>;
  getHealth(signal?: AbortSignal): Promise<HealthReport>;
  setSupplierDown(supplierId: string, down: boolean): Promise<SupplierStatus>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class HttpHotelApi implements HotelApi {
  constructor(
    private readonly baseUrl = '',
    private readonly fetchFn: FetchLike = (input, init) => fetch(input, init),
  ) {}

  async searchHotels(params: SearchParams, signal?: AbortSignal): Promise<HotelOffer[]> {
    const query = new URLSearchParams({ city: params.city });
    if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));

    const response = await this.request(`/api/hotels?${query}`, { signal });
    if (!response.ok) throw await this.toApiError(response);
    return (await response.json()) as HotelOffer[];
  }

  /** The backend answers 503 with a full report when it is "down", so a 503 with a body is still a report. */
  async getHealth(signal?: AbortSignal): Promise<HealthReport> {
    const response = await this.request('/health', { signal });
    const body = await this.readJson(response);
    if (body && typeof body === 'object' && 'dependencies' in body) return body as HealthReport;
    throw await this.toApiError(response, body);
  }

  async setSupplierDown(supplierId: string, down: boolean): Promise<SupplierStatus> {
    const response = await this.request(`/supplier${encodeURIComponent(supplierId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ down }),
    });
    if (!response.ok) throw await this.toApiError(response);
    return (await response.json()) as SupplierStatus;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    try {
      return await this.fetchFn(`${this.baseUrl}${path}`, init);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Is the backend running?');
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  private async toApiError(response: Response, parsedBody?: unknown): Promise<ApiError> {
    const body = (parsedBody ?? (await this.readJson(response))) as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | undefined;
    const error = body?.error;
    return new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `Request failed with HTTP ${response.status}`,
      error?.details,
    );
  }
}
