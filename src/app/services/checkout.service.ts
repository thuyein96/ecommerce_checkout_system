import { PromotionCode } from "@/models";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { extractAmountFromCode } from "@/utils/helpers";
import { isNotEligibleForCategory, isNotEligibleForProduct, isExceededGlobalLimit, isExceededUserLimit, isFormatIncorrect, isNotExist } from "./checkout.helper";
import { CartItem } from "@/context/CartContext";

export type PromoValidationReason =
  | "invalid_format"
  | "invalid_code"
  | "not_found"
  | "expired"
  | "conflict_with_active_coupon"
  | "exceeded_usage_limit"
  | "exceeded_global_limit"
  | "not_eligible"
  | "min_spend_not_met"
  | "unknown";

export interface PromoValidationResult {
  valid: boolean;
  reason?: PromoValidationReason;
  discountAmount: number; // currency amount applied to subtotal
  freeDelivery: boolean;
  promotionName?: string;
}

  let cartProductIds: string[] = [];
  let cartProductCategories: string[] = [];
  try {
    const cartRaw = localStorage.getItem("cart");
    if (cartRaw) {
      const cart = JSON.parse(cartRaw) as CartItem[];
      cartProductIds = cart.map((item) => item.product.product_id);
      cartProductCategories = cart.map((item) => item.product.product_category);
    }
  } catch {
    cartProductIds = [];
    cartProductCategories = [];
  }
  
// helpers to compute discount and effective delivery
export function computeDiscountForCoupon(
  coupon: PromotionCode | null,
  subtotalAmount: number
) {
  if (!coupon) return 0;
  // date validation intentionally omitted here (keeps original behaviour)
  if (coupon.Promotion_code_type === Promotion_code_type.Percentage) {
    const pct = extractAmountFromCode(coupon.Name) / 100;
    return subtotalAmount * pct;
  }
  if (coupon.Promotion_code_type === Promotion_code_type.Fixed) {
    return extractAmountFromCode(coupon.Name);
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


  const raw = localStorage.getItem("couponGlobalUsage");
  const counters = raw ? JSON.parse(raw) : {};
  counters[coupon.PromotionCode_id] = (counters[coupon.PromotionCode_id] || 0) + 1;
  localStorage.setItem("couponGlobalUsage", JSON.stringify(counters));
}

export function validatePromotionForCart(promotion: PromotionCode | null, subtotal: number,
  customerId: string, options?: { now?: Date; activePromotionName?: string }
): PromoValidationResult {
  const now = options?.now ?? new Date();
  const end = new Date(promotion?.End_date || 0);

  if (!promotion) {
    return { valid: false, reason: "not_found", discountAmount: 0, freeDelivery: false };
  }

  if (isNotExist(promotion)) {
    return { valid: false, reason: "invalid_code", discountAmount: 0, freeDelivery: false };
  }

  const userUsageLogs = localStorage.getItem("couponlogs") || "";
  if (isExceededUserLimit(promotion, customerId, userUsageLogs)) {
    return { valid: false, reason: "exceeded_usage_limit", discountAmount: 0, freeDelivery: false };
  }

  const globalUsageLogs = localStorage.getItem("couponGlobalUsage") || "";
  if (isExceededGlobalLimit(promotion, globalUsageLogs)) {
      return { valid: false, reason: "exceeded_global_limit", discountAmount: 0, freeDelivery: false };
  }

  // format rule: only uppercase letters & digits and optional Ccap tokens
  if (isFormatIncorrect(promotion.Name)) {
    return { valid: false, reason: "invalid_format", discountAmount: 0, freeDelivery: false };
  }

  if (options?.activePromotionName) {
    return { valid: false, reason: "conflict_with_active_coupon", discountAmount: 0, freeDelivery: false };
  }

  if (now > end) {
    return { valid: false, reason: "expired", discountAmount: 0, freeDelivery: false, 
      promotionName: promotion.Name };
  }

  if (typeof promotion.Min_spend === "number" && subtotal < promotion.Min_spend) {
    return { valid: false, reason: "min_spend_not_met", discountAmount: 0, freeDelivery: false, 
      promotionName: promotion.Name };
  }

  if (isNotEligibleForProduct(promotion, cartProductIds) && 
  isNotEligibleForCategory(promotion, cartProductCategories)) {
    return { valid: false, reason: "not_eligible", discountAmount: 0, freeDelivery: false, 
      promotionName: promotion.Name };
  }

  if (promotion.Promotion_code_type === Promotion_code_type.Free_delivery) {
    return { valid: true, discountAmount: 0, freeDelivery: true, promotionName: promotion.Name };
  }

  if (promotion.Promotion_code_type === Promotion_code_type.Fixed) {
    const amt = extractAmountFromCode(promotion.Name);
    const applied = Math.max(0, Math.min(subtotal, Number(amt || 0)));
    return { valid: true, discountAmount: Number(applied.toFixed(2)), freeDelivery: false, 
      promotionName: promotion.Name };
  }

  if (promotion.Promotion_code_type === Promotion_code_type.Percentage) {
    const pct = extractAmountFromCode(promotion.Name);
    const discountAmount = (subtotal * (pct / 100));

    const afterDiscount = Math.min(discountAmount, subtotal);
    return { valid: true, discountAmount: afterDiscount, freeDelivery: false, promotionName: promotion.Name };
  }

  return { valid: false, reason: "unknown", discountAmount: 0, freeDelivery: false };
}
