/** Identifier of a supplier, e.g. "A" or "B". Driven by configuration, so it is a plain string. */
export type SupplierId = string;

/** Raw hotel record as returned by a supplier API. */
export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

/** Normalised offer exposed to API clients. */
export interface HotelOffer {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

/** Both bounds are optional; a missing bound means "unbounded". */
export interface PriceFilter {
  minPrice?: number;
  maxPrice?: number;
}

export interface HotelSearchInput extends PriceFilter {
  city: string;
}

export interface HealthStatus {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

export type OverallStatus = 'ok' | 'degraded' | 'down';

export interface HealthReport {
  status: OverallStatus;
  timestamp: string;
  dependencies: Record<string, HealthStatus>;
}
