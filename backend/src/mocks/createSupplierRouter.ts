import { Router } from 'express';
import { z } from 'zod';
import type { SupplierId } from '../domain/models';
import { AppError } from '../utils/errors';
import { SUPPLIER_DATA } from './supplierData';

const statusSchema = z.object({ down: z.boolean() });

/**
 * Mock supplier API:
 *   GET /hotels?city=   static list filtered by city
 *   GET /health         liveness used by the health indicators
 *   PUT /status         { "down": true|false } simulate an outage at runtime
 */
export function createSupplierRouter(id: SupplierId, initiallyDown: boolean): Router {
  const router = Router();
  const state = { down: initiallyDown };

  router.put('/status', (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Body must be { "down": boolean }');
    state.down = parsed.data.down;
    res.json({ supplier: id, down: state.down });
  });

  router.use((_req, _res, next) => {
    if (state.down) return next(new AppError(503, 'SUPPLIER_DOWN', `Supplier ${id} is unavailable`));
    next();
  });

  router.get('/hotels', (req, res) => {
    const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : undefined;
    res.json(SUPPLIER_DATA[id].filter((hotel) => !city || hotel.city === city));
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
