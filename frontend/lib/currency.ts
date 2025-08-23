// Utility functions for working with currencies
//
// This module exports a helper to format numeric amounts according to the
// selected currency.  Each manager (hotel, restaurant or salon) may choose
// a currency in their settings.  The `formatCurrency` function takes an
// amount (as a number) and a currency code and returns a human friendly
// formatted string.  If the currency code is unrecognised the code itself
// is appended after the amount.

/**
 * Map of ISO currency codes to their human‑friendly symbols.  If a code
 * is missing from this map the formatter will fall back to appending
 * the uppercase currency code after the numeric value.  Symbols are
 * prefixed to the formatted number without any extra spacing (e.g.
 * `$10.00`, `DH100.00`).  You can extend this object with additional
 * currencies as needed.
 */
export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  JPY: '¥',
  MAD: 'DH',
  DH: 'DH',
  // Add additional currency codes and their preferred symbols here as needed
};

/**
 * Exchange rates relative to a base currency (USD by default).  The
 * values represent how many units of the target currency equal one
 * unit of the base currency.  For example, a value of 10 for MAD
 * means 1 USD = 10 MAD.  These rates are illustrative only and can
 * be updated to reflect real‑world values.  When adding a new
 * currency symbol above you should also include an appropriate
 * exchange rate here to ensure conversions work correctly.
 */
export const exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.3,
  AUD: 1.5,
  CHF: 0.9,
  JPY: 110,
  MAD: 10,
  DH: 10,
  // Extend with more currencies as needed.  The base (USD) rate must be 1.
};

/**
 * Convert an amount from one currency to another using the static
 * exchangeRates table.  Conversion is performed by normalising the
 * amount to the base currency (USD) and then scaling to the target.
 * If either currency is unknown the amount is returned unchanged.
 *
 * @param amount       The numeric value in the source currency
 * @param fromCurrency The ISO code of the source currency (default: USD)
 * @param toCurrency   The ISO code of the target currency
 */
export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  const fromRate = exchangeRates[from];
  const toRate = exchangeRates[to];
  if (!fromRate || !toRate) {
    // Unknown currency codes: return the original amount
    return amount;
  }
  // Convert to USD (base) then to target currency
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

/**
 * Format a numeric amount according to a currency code.
 *
 * The function will place the currency symbol before the amount when
 * available.  When a symbol is not defined the currency code will be
 * appended after the formatted number.  The amount is always rendered
 * with two decimal places to match the financial amounts used across
 * the application.  For example:
 *
 *   formatCurrency(10, 'USD')  => '$10.00'
 *   formatCurrency(15.5, 'EUR') => '€15.50'
 *   formatCurrency(20, 'DH')   => 'DH20.00'
 *   formatCurrency(5, 'XYZ')   => '5.00 XYZ'
 *
 * @param amount   The numeric value to format
 * @param currency The ISO currency code (e.g. USD, EUR, GBP, CAD, MAD)
 */
/**
 * Format a numeric amount according to a currency code.  The amount
 * supplied to this function is assumed to be expressed in the base
 * currency (USD) unless a different baseCurrency is provided.  The
 * value is automatically converted into the target currency using
 * exchangeRates.  The returned string includes the appropriate
 * currency symbol (when defined) or appends the currency code if no
 * symbol is available.
 *
 * Examples:
 *   formatCurrency(10, 'USD')       => '$10.00'
 *   formatCurrency(15.5, 'EUR')     => '€14.26' (based on example rates)
 *   formatCurrency(20, 'MAD')       => 'DH200.00'
 *   formatCurrency(5, 'XYZ')        => '5.00 XYZ'
 *
 * @param amount       The numeric amount in the base currency
 * @param currency     The ISO currency code to format into
 * @param baseCurrency The ISO code of the original currency (default: USD)
 */
export function formatCurrency(amount: number, currency: string | undefined | null, baseCurrency?: string): string {
  const targetCode = (currency || 'USD').toUpperCase();
  const baseCode = (baseCurrency || 'USD').toUpperCase();
  // Convert the amount into the target currency
  const converted = convertAmount(amount, baseCode, targetCode);
  const symbol = currencySymbols[targetCode];
  const formatted = converted.toFixed(2);
  if (symbol) {
    return `${symbol}${formatted}`;
  }
  return `${formatted} ${targetCode}`;
}