import { PromotionCode } from "@/models";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { amountFromName } from "@/utils/helpers";
import { DATA } from "@/data";

export type PromoValidationReason =
  | "invalid_format"
  | "not_found"
  | "expired"
  | "conflict_with_active_coupon"
  | "exceeded_usage_limit"
  | "min_spend_not_met"
  | "unknown";

export interface PromoValidationResult {
  valid: boolean;
  reason?: PromoValidationReason;
  discountAmount: number; // currency amount applied to subtotal
  freeDelivery: boolean;
  promotionName?: string;
}

// helpers to compute discount and effective delivery
export function computeDiscountForCoupon(
  coupon: PromotionCode | null,
  subtotalAmount: number
) {
  if (!coupon) return 0;
  // date validation intentionally omitted here (keeps original behaviour)
  if (coupon.Promotion_code_type === Promotion_code_type.Percentage) {
    const pct = amountFromName(coupon.Name) / 100;
    return subtotalAmount * pct;
  }
  if (coupon.Promotion_code_type === Promotion_code_type.Fixed) {
    return amountFromName(coupon.Name);
  }
  // Free delivery -> no discount on price; handled by effectiveDelivery
  return 0;
}

export function computeEffectiveDelivery(coupon: PromotionCode | null, baseDelivery: number) {
  if (coupon?.Promotion_code_type === Promotion_code_type.Free_delivery) return 0;
  return baseDelivery;
}

export function logCouponUsage(customerId: string, coupon: PromotionCode) {
  const couponLogs = localStorage.getItem("couponlogs");
  const logs = couponLogs ? JSON.parse(couponLogs) : {};
  const customerLogs = logs[customerId] || [];
  if (customerLogs) {
    customerLogs.push({ coupon: coupon.PromotionCode_id });
  } else {
    logs[customerId] = [{ coupon: coupon.PromotionCode_id }];
  }
  logs[customerId] = customerLogs;
  localStorage.setItem("couponlogs", JSON.stringify(logs));
}

export function validatePromotionForCart(
  promotion: PromotionCode | null,
  subtotal: number,
  customerId: string,
  options?: { now?: Date; activePromotionName?: string }
): PromoValidationResult {
  const now = options?.now ?? new Date();

  if (!promotion) {
    return { valid: false, reason: "not_found", discountAmount: 0, freeDelivery: false };
  }

  // check if customer has used this coupon before
  if (!checkCouponUsage(customerId, promotion)) {
    return { valid: false, reason: "exceeded_usage_limit", discountAmount: 0, freeDelivery: false };
  }

  const name = promotion.Name ?? "";
  // format rule: only uppercase letters & digits and optional Ccap tokens
  if (!/^[A-Z0-9C]+$/.test(name)) {
    return { valid: false, reason: "invalid_format", discountAmount: 0, freeDelivery: false };
  }

  if (options?.activePromotionName && options.activePromotionName === promotion.Name) {
    return { valid: false, reason: "conflict_with_active_coupon", discountAmount: 0, freeDelivery: false };
  }

  const start = new Date(promotion.Start_date);
  const end = new Date(promotion.End_date);
  console.log("Promotion validity period:", start, end, "Now:", now);
  if (now < start || now > end) {
    return { valid: false, reason: "expired", discountAmount: 0, freeDelivery: false, promotionName: promotion.Name };
  }

  // enforce minimum spend if present on the promotion
  if (typeof promotion.Min_spend === "number" && subtotal < promotion.Min_spend) {
    return { valid: false, reason: "min_spend_not_met", discountAmount: 0, freeDelivery: false, promotionName: promotion.Name };
  }

  // compute based on type
  const type = promotion.Promotion_code_type;
  if (type === Promotion_code_type.Free_delivery) {
    return { valid: true, discountAmount: 0, freeDelivery: true, promotionName: promotion.Name };
  }

  if (type === Promotion_code_type.Fixed) {
    const amt = amountFromName(name);
    const applied = Math.max(0, Math.min(subtotal, Number(amt || 0)));
    return { valid: true, discountAmount: Number(applied.toFixed(2)), freeDelivery: false, promotionName: promotion.Name };
  }

  if (type === Promotion_code_type.Percentage) {
    const pct = amountFromName(name);
    const raw = (subtotal * (pct / 100));
    // optional cap: parse C<number>
    const capMatch = name.match(/C(\d+)/);
    const cap = capMatch ? Number(capMatch[1]) : undefined;
    let discount = raw;
    if (cap !== undefined) discount = Math.min(discount, cap);
    discount = Math.min(discount, subtotal);
    return { valid: true, discountAmount: Number(discount.toFixed(2)), freeDelivery: false, promotionName: promotion.Name };
  }

  return { valid: false, reason: "unknown", discountAmount: 0, freeDelivery: false };
}

export function checkCouponUsage(customerId: string, promotion: PromotionCode) {
  try {
    if (typeof localStorage === "undefined") return true;
    const couponLogs = localStorage.getItem("couponlogs");
    if (couponLogs) {
      const logs = JSON.parse(couponLogs);
      const customerLogs = logs[customerId] || [];
      const usedCoupon = customerLogs.find((log: { coupon: string; }) => log.coupon === promotion.PromotionCode_id);
      if (!usedCoupon) {
        return true;
      }
      return false;
    }
    return true;
  } catch {
    // if localStorage is not available (server-side tests), allow usage
    return true;
  }
}
