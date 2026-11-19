import type { HotelOffer, HotelSearchInput } from '../domain/models';

export interface IHotelSearchService {
  search(input: HotelSearchInput): Promise<HotelOffer[]>;
}
