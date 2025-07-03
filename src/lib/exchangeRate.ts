// src/lib/exchangeRate.ts

const API_KEY = "6701dd6425629aff301ad15009566294";
const BASE_URL = "https://api.exchangerate.host";

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number | null> {
  try {
    const url = `${BASE_URL}/convert?from=${from}&to=${to}&amount=1&access_key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.success && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
}