import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number in compact notation (e.g., 1K, 1.5M, 2B)
 * @param value number to format
 * @param digits number of decimal places (default 1)
 */
export function formatCompactNumber(value: number, digits = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  if (Math.abs(value) < 1000) return value.toLocaleString();
  const units = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];
  for (const unit of units) {
    if (Math.abs(value) >= unit.value) {
      return (value / unit.value).toFixed(digits).replace(/\.0+$/, '') + unit.symbol;
    }
  }
  return value.toLocaleString();
}
