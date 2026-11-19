import { z } from 'zod';
import type { HotelSearchInput } from '../../domain/models';
import { AppError } from '../../utils/errors';

const optionalPrice = z.coerce.number().finite().nonnegative().optional();

const hotelQuerySchema = z
  .object({
    city: z.string().trim().min(1, 'city is required').transform((value) => value.toLowerCase()),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });

export class HotelQueryParser {
  /** Validates `?city=&minPrice=&maxPrice=`. Empty strings count as "not provided". */
  static parse(query: unknown): HotelSearchInput {
    const cleaned = Object.fromEntries(
      Object.entries((query ?? {}) as Record<string, unknown>).filter(([, value]) => value !== ''),
    );
    const result = hotelQuerySchema.safeParse(cleaned);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', result.error.flatten().fieldErrors);
    }
    return result.data;
  }
}
