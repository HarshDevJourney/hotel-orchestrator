import type { HotelOffer, PriceFilter, SupplierId } from '../domain/models';

/** The activity surface the workflow can call (type-only import inside the workflow sandbox). */
export interface HotelActivityApi {
  listSuppliers(): Promise<SupplierId[]>;
  fetchSupplierOffers(id: SupplierId, city: string): Promise<HotelOffer[]>;
  selectBestOffers(offers: HotelOffer[]): Promise<HotelOffer[]>;
  saveHotels(city: string, hotels: HotelOffer[]): Promise<void>;
  findHotelsByPrice(city: string, filter: PriceFilter): Promise<HotelOffer[]>;
}
