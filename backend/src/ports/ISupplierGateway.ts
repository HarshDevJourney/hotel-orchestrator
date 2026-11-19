import type { HotelOffer, SupplierId } from '../domain/models';

/**
 * Contract (LSP): returns normalised offers whose `supplier` label identifies this
 * gateway, and THROWS when the supplier cannot be reached (never partial/invalid data).
 */
export interface ISupplierGateway {
  readonly id: SupplierId;
  fetchHotels(city: string): Promise<HotelOffer[]>;
}
