import type { SupplierHotel, SupplierId } from '../domain/models';

/** Static datasets. The suppliers deliberately overlap on several hotel names. */
export const SUPPLIER_DATA: Record<SupplierId, SupplierHotel[]> = {
  A: [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'Taj Palace', price: 12000, city: 'delhi', commissionPct: 12 },
    { hotelId: 'a4', name: 'Lemon Tree', price: 4500, city: 'delhi', commissionPct: 11 },
    { hotelId: 'a5', name: 'Ibis', price: 4200, city: 'delhi', commissionPct: 9 },
    { hotelId: 'a6', name: 'Trident', price: 9000, city: 'mumbai', commissionPct: 14 },
    { hotelId: 'a7', name: 'Holtin', price: 6500, city: 'mumbai', commissionPct: 10 },
  ],
  B: [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6100, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b3', name: 'Taj Palace', price: 11500, city: 'delhi', commissionPct: 10 },
    { hotelId: 'b4', name: 'Lemon tree', price: 4700, city: 'delhi', commissionPct: 14 },
    { hotelId: 'b5', name: 'Hyatt', price: 9800, city: 'delhi', commissionPct: 12 },
    { hotelId: 'b6', name: 'Trident', price: 8800, city: 'mumbai', commissionPct: 11 },
  ],
};
