const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (value: number): string => priceFormatter.format(value);

/** "supplierA" -> "Supplier A", "redis" -> "Redis" */
export function formatDependencyName(name: string): string {
  const supplier = /^supplier(.+)$/i.exec(name);
  if (supplier) return `Supplier ${supplier[1]}`;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
