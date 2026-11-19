import type { HotelOffer } from '../domain/models';

/**
 * Contract (LSP): returns at most one offer per hotel name, sorted by price ascending.
 * Implementations are pure (no I/O).
 */
export interface IOfferSelector {
  select(offers: HotelOffer[]): HotelOffer[];
}
