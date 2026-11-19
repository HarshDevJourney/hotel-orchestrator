import { useMemo, useState } from 'react';
import type { HotelOffer } from '../api/types';
import { formatPrice } from '../utils/format';
import { sortHotels, type SortDirection, type SortKey } from '../utils/sortHotels';

interface HotelTableProps {
  hotels: HotelOffer[];
}

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: 'name', label: 'Hotel' },
  { key: 'price', label: 'Best price', numeric: true },
  { key: 'supplier', label: 'Supplier' },
  { key: 'commissionPct', label: 'Commission', numeric: true },
];

const supplierClass = (supplier: string): string => `badge supplier-${supplier.slice(-1).toLowerCase()}`;

export function HotelTable({ hotels }: HotelTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const rows = useMemo(() => sortHotels(hotels, sortKey, direction), [hotels, sortKey, direction]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) return setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    setSortKey(key);
    setDirection('asc');
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map(({ key, label, numeric }) => (
              <th key={key} className={numeric ? 'num' : undefined} aria-sort={key === sortKey ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="sort" onClick={() => toggleSort(key)}>
                  {label}
                  <span aria-hidden="true">{key === sortKey ? (direction === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((hotel) => (
            <tr key={hotel.name}>
              <td className="name">{hotel.name}</td>
              <td className="num price">{formatPrice(hotel.price)}</td>
              <td>
                <span className={supplierClass(hotel.supplier)}>{hotel.supplier}</span>
              </td>
              <td className="num">{hotel.commissionPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
