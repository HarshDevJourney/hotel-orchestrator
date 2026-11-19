import type Redis from 'ioredis';
import { normalizeHotelName } from '../../domain/hotelName';
import type { HotelOffer, PriceFilter } from '../../domain/models';
import type { IHotelPriceQuery, IHotelWriter } from '../../ports';

/**
 * Redis layout per city:
 *   hotels:<city>:data      HASH   normalizedName -> JSON(HotelOffer)
 *   hotels:<city>:by-price  ZSET   member = normalizedName, score = price
 *
 * Price filtering is executed by Redis (ZRANGEBYSCORE); the hash only hydrates matching members.
 */
export class RedisHotelRepository implements IHotelWriter, IHotelPriceQuery {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number,
  ) {}

  async replaceCity(city: string, hotels: HotelOffer[]): Promise<void> {
    const dataKey = this.dataKey(city);
    const priceKey = this.priceKey(city);
    const tx = this.redis.multi().del(dataKey, priceKey);

    if (hotels.length > 0) {
      const entries = hotels.map((hotel) => [normalizeHotelName(hotel.name), hotel] as const);
      tx.hset(dataKey, Object.fromEntries(entries.map(([key, hotel]) => [key, JSON.stringify(hotel)])));
      tx.zadd(priceKey, ...entries.flatMap(([key, hotel]) => [hotel.price, key]));
      tx.expire(dataKey, this.ttlSeconds);
      tx.expire(priceKey, this.ttlSeconds);
    }

    const results = await tx.exec();
    const failure = results?.find(([error]) => error);
    if (!results || failure) {
      throw failure?.[0] ?? new Error('Redis transaction aborted');
    }
  }

  async findByPriceRange(city: string, { minPrice, maxPrice }: PriceFilter): Promise<HotelOffer[]> {
    const members = await this.redis.zrangebyscore(this.priceKey(city), minPrice ?? '-inf', maxPrice ?? '+inf');
    if (members.length === 0) return [];

    const raw = await this.redis.hmget(this.dataKey(city), ...members);
    return raw.filter((value): value is string => value !== null).map((value) => JSON.parse(value) as HotelOffer);
  }

  private dataKey(city: string): string {
    return `hotels:${city}:data`;
  }

  private priceKey(city: string): string {
    return `hotels:${city}:by-price`;
  }
}
