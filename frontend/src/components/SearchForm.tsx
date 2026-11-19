import { useState, type FormEvent } from 'react';
import type { SearchParams } from '../api/types';
import { validateSearch, type SearchErrors, type SearchFormValues } from '../utils/validateSearch';

interface SearchFormProps {
  loading: boolean;
  onSearch: (params: SearchParams) => void;
}

const CITY_SUGGESTIONS = ['delhi', 'mumbai'];

export function SearchForm({ loading, onSearch }: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>({ city: 'delhi', minPrice: '', maxPrice: '' });
  const [errors, setErrors] = useState<SearchErrors>({});

  const update = (field: keyof SearchFormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateSearch(values);
    if (!result.ok) return setErrors(result.errors);
    setErrors({});
    onSearch(result.params);
  };

  const reset = () => {
    setValues({ city: 'delhi', minPrice: '', maxPrice: '' });
    setErrors({});
  };

  return (
    <form className="card search-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="city">City</label>
        <input id="city" list="city-suggestions" value={values.city} onChange={update('city')} aria-invalid={!!errors.city} placeholder="e.g. delhi" />
        <datalist id="city-suggestions">
          {CITY_SUGGESTIONS.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        {errors.city && <span className="field-error">{errors.city}</span>}
      </div>

      <div className="field">
        <label htmlFor="minPrice">Min price (₹)</label>
        <input id="minPrice" inputMode="numeric" value={values.minPrice} onChange={update('minPrice')} aria-invalid={!!errors.minPrice} placeholder="Any" />
        {errors.minPrice && <span className="field-error">{errors.minPrice}</span>}
      </div>

      <div className="field">
        <label htmlFor="maxPrice">Max price (₹)</label>
        <input id="maxPrice" inputMode="numeric" value={values.maxPrice} onChange={update('maxPrice')} aria-invalid={!!errors.maxPrice} placeholder="Any" />
        {errors.maxPrice && <span className="field-error">{errors.maxPrice}</span>}
      </div>

      <div className="actions">
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="ghost" onClick={reset} disabled={loading}>
          Reset
        </button>
      </div>
    </form>
  );
}
