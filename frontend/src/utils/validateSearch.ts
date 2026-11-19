import type { SearchParams } from '../api/types';

export interface SearchFormValues {
  city: string;
  minPrice: string;
  maxPrice: string;
}

export type SearchErrors = Partial<Record<keyof SearchFormValues, string>>;

export type ValidationResult = { ok: true; params: SearchParams } | { ok: false; errors: SearchErrors };

/** undefined = empty, null = invalid, number = valid */
const parsePrice = (raw: string): number | undefined | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/** Mirrors the backend rules so users get instant feedback (the backend still validates). */
export function validateSearch(values: SearchFormValues): ValidationResult {
  const errors: SearchErrors = {};
  const city = values.city.trim();
  const min = parsePrice(values.minPrice);
  const max = parsePrice(values.maxPrice);

  if (!city) errors.city = 'Enter a city';
  if (min === null) errors.minPrice = 'Enter a valid, non-negative number';
  if (max === null) errors.maxPrice = 'Enter a valid, non-negative number';
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    errors.minPrice = 'Min price must not exceed max price';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    params: {
      city,
      ...(typeof min === 'number' ? { minPrice: min } : {}),
      ...(typeof max === 'number' ? { maxPrice: max } : {}),
    },
  };
}
