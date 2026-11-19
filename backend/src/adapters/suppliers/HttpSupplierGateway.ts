import { z } from 'zod';
import type { HotelOffer, SupplierHotel, SupplierId } from '../../domain/models';
import type { ISupplierGateway } from '../../ports';

const supplierResponseSchema = z.array(
  z.object({
    hotelId: z.string(),
    name: z.string().min(1),
    price: z.number().nonnegative(),
    city: z.string(),
    commissionPct: z.number().nonnegative(),
  }),
);

/** Calls `GET {baseUrl}/supplier{id}/hotels?city=` and maps the response to HotelOffer. One instance per supplier. */
export class HttpSupplierGateway implements ISupplierGateway {
  constructor(
    public readonly id: SupplierId,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async fetchHotels(city: string): Promise<HotelOffer[]> {
    const url = `${this.baseUrl}/supplier${this.id}/hotels?city=${encodeURIComponent(city)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) {
      throw new Error(`Supplier ${this.id} responded with HTTP ${response.status}`);
    }
    const hotels: SupplierHotel[] = supplierResponseSchema.parse(await response.json());
    return hotels.map((hotel) => this.toOffer(hotel));
  }

  private toOffer(hotel: SupplierHotel): HotelOffer {
    return {
      name: hotel.name,
      price: hotel.price,
      commissionPct: hotel.commissionPct,
      supplier: `Supplier ${this.id}`,
    };
  }
}
