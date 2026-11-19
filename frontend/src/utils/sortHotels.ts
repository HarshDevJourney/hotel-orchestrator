import type { HotelOffer } from '../api/types';

export type SortKey = 'name' | 'price' | 'supplier' | 'commissionPct';
export type SortDirection = 'asc' | 'desc';

export function sortHotels(hotels: HotelOffer[], key: SortKey, direction: SortDirection): HotelOffer[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...hotels].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
    return order * factor;
  });
}
