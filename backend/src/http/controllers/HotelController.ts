import type { Request, Response } from 'express';
import type { IHotelSearchService } from '../../ports';
import { HotelQueryParser } from './HotelQueryParser';

/** HTTP concerns only: parse input, delegate, write the response. */
export class HotelController {
  constructor(private readonly hotelService: IHotelSearchService) {}

  readonly getHotels = async (req: Request, res: Response): Promise<void> => {
    const input = HotelQueryParser.parse(req.query);
    res.json(await this.hotelService.search(input));
  };
}
