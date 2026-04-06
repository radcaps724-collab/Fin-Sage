const DEFAULT_LOCALE = "en-IN";
const DEFAULT_CURRENCY = "INR";

export const normalizeCurrencyCode = (currency?: string): string => {
  const normalized = currency?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : DEFAULT_CURRENCY;
};

export const createCurrencyFormatter = (
  currency?: string,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat =>
  new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: normalizeCurrencyCode(currency),
    maximumFractionDigits: 0,
    ...options,
  });

export const formatCurrency = (
  value: number,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string => createCurrencyFormatter(currency, options).format(value);

export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
