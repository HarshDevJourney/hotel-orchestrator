import { Context } from '@temporalio/activity';
import { ApplicationFailure } from '@temporalio/common';
import type { HotelOffer, PriceFilter, SupplierId } from '../domain/models';
import type { IHotelPriceQuery, IHotelWriter, IOfferSelector, ISupplierGateway } from '../ports';
import { createLogger } from '../utils/logger';
import type { HotelActivityApi } from './HotelActivityApi';
import { UNKNOWN_SUPPLIER } from './names';

const log = createLogger('activities');

export interface HotelActivitiesDependencies {
  gateways: ISupplierGateway[];
  selector: IOfferSelector;
  writer: IHotelWriter;
  priceQuery: IHotelPriceQuery;
}

const currentAttempt = (): number | undefined => {
  try {
    return Context.current().info.attempt;
  } catch {
    return undefined; // not running inside a Temporal activity (e.g. unit tests)
  }
};

/**
 * All side effects of the workflow. Every dependency is an abstraction (DIP) and is injected
 * by the composition root. Methods are arrow properties so they stay bound when registered.
 */
export class HotelActivities implements HotelActivityApi {
  private readonly gateways: ISupplierGateway[];
  private readonly selector: IOfferSelector;
  private readonly writer: IHotelWriter;
  private readonly priceQuery: IHotelPriceQuery;

  constructor(deps: HotelActivitiesDependencies) {
    this.gateways = deps.gateways;
    this.selector = deps.selector;
    this.writer = deps.writer;
    this.priceQuery = deps.priceQuery;
  }

  /** Plain object handed to the Temporal worker (only the activity functions). */
  registry(): HotelActivityApi {
    return {
      listSuppliers: this.listSuppliers,
      fetchSupplierOffers: this.fetchSupplierOffers,
      selectBestOffers: this.selectBestOffers,
      saveHotels: this.saveHotels,
      findHotelsByPrice: this.findHotelsByPrice,
    };
  }

  readonly listSuppliers = async (): Promise<SupplierId[]> => this.gateways.map((gateway) => gateway.id);

  readonly fetchSupplierOffers = async (id: SupplierId, city: string): Promise<HotelOffer[]> => {
    const context = { activity: 'fetchSupplierOffers', supplier: id, city, attempt: currentAttempt() };
    const gateway = this.gateways.find((candidate) => candidate.id === id);
    if (!gateway) {
      throw ApplicationFailure.nonRetryable(`Unknown supplier "${id}"`, UNKNOWN_SUPPLIER);
    }
    try {
      const offers = await gateway.fetchHotels(city);
      log.info({ ...context, count: offers.length }, 'Fetched supplier offers');
      return offers;
    } catch (error) {
      log.error({ ...context, err: error }, 'Supplier call failed');
      throw error;
    }
  };

  readonly selectBestOffers = async (offers: HotelOffer[]): Promise<HotelOffer[]> => {
    const selected = this.selector.select(offers);
    log.info({ activity: 'selectBestOffers', input: offers.length, output: selected.length }, 'Selected best offers');
    return selected;
  };

  readonly saveHotels = async (city: string, hotels: HotelOffer[]): Promise<void> => {
    try {
      await this.writer.replaceCity(city, hotels);
      log.info({ activity: 'saveHotels', city, count: hotels.length }, 'Saved hotels to Redis');
    } catch (error) {
      log.error({ activity: 'saveHotels', city, err: error }, 'Failed to save hotels to Redis');
      throw error;
    }
  };

  readonly findHotelsByPrice = async (city: string, filter: PriceFilter): Promise<HotelOffer[]> => {
    try {
      const hotels = await this.priceQuery.findByPriceRange(city, filter);
      log.info({ activity: 'findHotelsByPrice', city, ...filter, count: hotels.length }, 'Filtered hotels in Redis');
      return hotels;
    } catch (error) {
      log.error({ activity: 'findHotelsByPrice', city, err: error }, 'Redis price filter failed');
      throw error;
    }
  };
}
