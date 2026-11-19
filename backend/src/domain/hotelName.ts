/** Canonical form of a hotel name used to detect the same hotel across suppliers. */
export const normalizeHotelName = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ');
