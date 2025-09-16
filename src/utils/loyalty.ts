// utils/loyalty.ts
import type { Customer, PromotionCode } from "@/models";

export const pointsToBaht = (points: number) => Math.floor(points / 10); // 10 pts = 1 baht
export const bahtToPoints = (baht: number) => baht * 10;

export const normalizePointsToRedeem = (
    requestedPoints: number,
    balancePoints: number,
    capBaht: number // maximum baht discount allowed by the payable amount
) => {
    const maxByBalance = Math.max(0, balancePoints);     // can’t exceed your balance
    const maxByAmountPts = bahtToPoints(Math.max(0, Math.floor(capBaht))); // convert allowed baht to points (e.g., ฿37 → 370 pts)
    // clamp then snap to multiple of 10 (clean baht)
    const clamped = Math.max(0, Math.min(requestedPoints, maxByBalance, maxByAmountPts));
    return clamped - (clamped % 10);
};

export const isCouponActive = (p: PromotionCode, now = new Date()) => {
    const s = new Date(p.Start_date), e = new Date(p.End_date);
    return now >= s && now <= e;
};

// Earn 1 point per 100 baht (floor). If you want to exclude shipping, pass the amount without shipping.
export const pointsEarnedFrom = (finalChargeBaht: number) => Math.floor(finalChargeBaht / 100);

// Persist “demo DB” to localStorage for profile reflection
export function persistUpdatedCustomer(updated: Customer) {
    try { localStorage.setItem("demo_customer", JSON.stringify(updated)); } catch { }
}
