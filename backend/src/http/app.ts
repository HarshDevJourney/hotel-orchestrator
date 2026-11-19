import express, { type Express } from 'express';
import pinoHttp from 'pino-http';
import { config } from '../config';
import { createSupplierRouter } from '../mocks/createSupplierRouter';
import { SUPPLIER_DATA } from '../mocks/supplierData';
import { logger } from '../utils/logger';
import type { HealthController } from './controllers/HealthController';
import type { HotelController } from './controllers/HotelController';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errorHandler';

interface AppDependencies {
  hotelController: HotelController;
  healthController: HealthController;
}

export function createApp({ hotelController, healthController }: AppDependencies): Express {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/api/hotels', asyncHandler(hotelController.getHotels));
  app.get('/health', asyncHandler(healthController.getHealth));

  // Mock suppliers live inside this service (/supplierA/..., /supplierB/...)
  for (const id of Object.keys(SUPPLIER_DATA)) {
    app.use(`/supplier${id}`, createSupplierRouter(id, config.suppliers.initiallyDown[id] ?? false));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
