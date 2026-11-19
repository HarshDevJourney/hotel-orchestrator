import type { HotelOffer, PriceFilter } from '../domain/models';

export interface IHotelPriceQuery {
  /** Hotels within [minPrice, maxPrice], cheapest first. A missing bound is unbounded. */
  findByPriceRange(city: string, filter: PriceFilter): Promise<HotelOffer[]>;
}
