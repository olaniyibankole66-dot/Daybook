export const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian naira", locale: "en-NG" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian cedi", locale: "en-GH" },
  { code: "KES", symbol: "KSh", name: "Kenyan shilling", locale: "en-KE" },
  { code: "ZAR", symbol: "R", name: "South African rand", locale: "en-ZA" },
  { code: "UGX", symbol: "USh", name: "Ugandan shilling", locale: "en-UG" },
  { code: "XOF", symbol: "CFA ", name: "West African CFA", locale: "fr-SN" },
  { code: "USD", symbol: "$", name: "US dollar", locale: "en-US" },
  { code: "GBP", symbol: "£", name: "British pound", locale: "en-GB" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function currencyByCode(code: string) {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: string): string {
  const spec = currencyByCode(currency);
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);
  const fraction = Math.round(abs * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat(spec.locale, {
    minimumFractionDigits: fraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${negative ? "−" : ""}${spec.symbol}${formatted}`;
}

export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return roundMoney(value);
}

export function parseQty(raw: string): number | null {
  const cleaned = raw.trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}
