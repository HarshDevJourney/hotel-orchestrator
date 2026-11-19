export interface HotelOffer {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface SearchParams {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface DependencyStatus {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  dependencies: Record<string, DependencyStatus>;
}

export interface SupplierStatus {
  supplier: string;
  down: boolean;
}
