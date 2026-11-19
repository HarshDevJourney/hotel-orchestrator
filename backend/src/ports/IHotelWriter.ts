import type { HotelOffer } from '../domain/models';

export interface IHotelWriter {
  /** Atomically replaces everything stored for the city. */
  replaceCity(city: string, hotels: HotelOffer[]): Promise<void>;
}
