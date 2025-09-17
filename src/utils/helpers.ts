export function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "THB" });
}

// Extract a numeric amount from promo code name (SAVE20 -> 20)
export function extractAmountFromCode(name: string) {
  const m = name.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

export const DELIVERY_FEES = {
  standard: 19.00,
  priority: 29.00,
};