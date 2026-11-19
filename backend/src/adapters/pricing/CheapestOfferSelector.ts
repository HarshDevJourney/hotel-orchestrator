import { normalizeHotelName } from '../../domain/hotelName';
import type { HotelOffer } from '../../domain/models';
import type { IOfferSelector } from '../../ports';

/**
 * Keeps the cheapest offer per hotel name. On equal prices the offer that appears first wins
 * (activities pass gateways in configuration order, so Supplier A wins ties).
 */
export class CheapestOfferSelector implements IOfferSelector {
  select(offers: HotelOffer[]): HotelOffer[] {
    const best = new Map<string, HotelOffer>();

    for (const offer of offers) {
      const key = this.normalizeName(offer.name);
      const current = best.get(key);
      if (!current || offer.price < current.price) {
        best.set(key, offer);
      }
    }

    return [...best.values()].sort((a, b) => a.price - b.price || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  private normalizeName(name: string): string {
    return normalizeHotelName(name);
  }
}
