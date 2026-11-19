import { ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';
import type { HotelOffer, HotelSearchInput } from '../domain/models';
import type { HotelActivityApi } from './HotelActivityApi';
import { ALL_SUPPLIERS_UNAVAILABLE } from './names';

const { listSuppliers, fetchSupplierOffers, selectBestOffers, saveHotels, findHotelsByPrice } =
  proxyActivities<HotelActivityApi>({
    startToCloseTimeout: '10 seconds',
    retry: { maximumAttempts: 3, initialInterval: '500 milliseconds', backoffCoefficient: 2 },
  });

/**
 * 1. Ask which suppliers are configured (no hardcoded supplier list)
 * 2. Call all suppliers in parallel; one failing supplier degrades gracefully
 * 3. Let the configured strategy pick the best offer per hotel
 * 4. Save the result in Redis
 * 5. If a price range was given, Redis does the filtering
 */
export async function hotelOfferWorkflow(input: HotelSearchInput): Promise<HotelOffer[]> {
  const { city, minPrice, maxPrice } = input;

  const supplierIds = await listSuppliers();
  const settled = await Promise.allSettled(supplierIds.map((id) => fetchSupplierOffers(id, city)));

  const offers: HotelOffer[] = [];
  let failedSuppliers = 0;
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      offers.push(...result.value);
    } else {
      failedSuppliers++;
      log.warn('Supplier unavailable, continuing with remaining suppliers', {
        supplier: supplierIds[index],
        city,
        reason: String(result.reason),
      });
    }
  });

  if (supplierIds.length === 0 || failedSuppliers === supplierIds.length) {
    throw ApplicationFailure.nonRetryable('All suppliers are unavailable', ALL_SUPPLIERS_UNAVAILABLE);
  }

  const bestOffers = await selectBestOffers(offers);
  await saveHotels(city, bestOffers);

  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
  return hasPriceFilter ? findHotelsByPrice(city, { minPrice, maxPrice }) : bestOffers;
}
