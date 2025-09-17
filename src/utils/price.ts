// src/utils/price.ts
import { normalizePointsToRedeem, pointsToBaht } from "@/utils/loyalty";

/**
 * computeFinalPrice
 * Mirrors the formula used by finalizeCheckout:
 *   Final = Subtotal − CouponDiscount − RedeemValue + Delivery
 *
 * Notes:
 * - `requestedPoints` is in POINTS; this function converts/caps it the same
 *   way as your app: clamp to user balance and to payable-before-points.
 * - `loyaltyBalance` defaults to a very large number so you can reuse this
 *   for cases where the balance is not part of the scenario.
 * - All inputs are clamped to be non-negative, and the final result is floored
 *   at 0 with 2-decimal precision to avoid tiny float negatives.
 */
export const computeFinalPrice = (
  subtotal: number,
  couponDiscount: number,
  requestedPoints: number,   // points (not baht)
  deliveryFee: number,
  loyaltyBalance: number = Number.MAX_SAFE_INTEGER
): {
  finalTotal: number;
  pointsSpent: number;
  pointsDiscountBaht: number;
  payableBeforePoints: number;
} => {
  // --- Guards: never allow negative inputs ---
  const s = Math.max(0, subtotal);
  const c = Math.max(0, couponDiscount);
  const d = Math.max(0, deliveryFee);
  const reqPts = Math.max(0, requestedPoints);

  // --- Amount that can be charged before applying points ---
  // (same as finalizeCheckout: subtotal + delivery − discount)
  const payableBeforePoints = Math.max(0, s + d - c);

  // --- Normalize/cap points exactly like the app ---
  const pointsSpent = normalizePointsToRedeem(
    reqPts,
    Math.max(0, loyaltyBalance),
    payableBeforePoints
  );
  const pointsDiscountBaht = pointsToBaht(pointsSpent);

  // --- Final total (never negative, keep 2-decimals) ---
  const raw = payableBeforePoints - pointsDiscountBaht;
  const finalTotal = Math.max(0, Number(raw.toFixed(2)));

  return { finalTotal, pointsSpent, pointsDiscountBaht, payableBeforePoints };
};
