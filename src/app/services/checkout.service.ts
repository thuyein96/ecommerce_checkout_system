import { PromotionCode } from "@/models";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { amountFromName } from "@/utils/helpers";
import promotion_codes from "@/data/promotion_codes.json";

export type PromoValidationReason =
  | "invalid_format"
  | "invalid_code"
  | "not_found"
  | "expired"
  | "conflict_with_active_coupon"
  | "exceeded_usage_limit"
  | "exceeded_global_limit"
  | "not_eligible_product"
  | "not_eligible_category"
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


  const raw = localStorage.getItem("couponGlobalUsage");
  const counters = raw ? JSON.parse(raw) : {};
  counters[coupon.PromotionCode_id] = (counters[coupon.PromotionCode_id] || 0) + 1;
  localStorage.setItem("couponGlobalUsage", JSON.stringify(counters));
}

export function validatePromotionForCart(
  promotion: PromotionCode | null,
  subtotal: number,
  customerId: string,
  options?: { now?: Date; activePromotionName?: string }
): PromoValidationResult {
  // options.cartProductIds: optional array of product ids present in the cart
  const cartItems = localStorage.getItem("cart");
  const cartProductIds = cartItems
    ? JSON.parse(cartItems).map(
        (item: { product: { product_id: string } }) => item.product.product_id
      )
    : [];
  // also collect product categories from cart if available
  const cartProductCategories = cartItems
    ? JSON.parse(cartItems).map(
        (item: { product: { product_category?: string } }) => item.product.product_category
      ).filter(Boolean)
    : [];
  const now = options?.now ?? new Date();

  if (!promotion) {
    return { valid: false, reason: "not_found", discountAmount: 0, freeDelivery: false };
  }

  if(promotion_codes.findIndex(p => p.PromotionCode_id === promotion.PromotionCode_id) === -1) {
    return { valid: false, reason: "invalid_code", discountAmount: 0, freeDelivery: false };
  }

  // check if customer has used this coupon before
  if (checkCouponUsage(customerId, promotion) === "NOT_ALLOW") {
    return { valid: false, reason: "exceeded_usage_limit", discountAmount: 0, freeDelivery: false };
  }

  if (typeof promotion.Global_limit === "number") {
    if (checkGlobalUsage(promotion) === "NOT_ALLOW") {
      return { valid: false, reason: "exceeded_global_limit", discountAmount: 0, freeDelivery: false };
    }
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

  // enforce eligible products if the promotion specifies Eligible_products
  // enforce eligible products/categories: allow match by product OR category
  const hasProductRestrictions = Array.isArray(promotion.Eligible_products) && promotion.Eligible_products.length > 0;
  const hasCategoryRestrictions = Array.isArray(promotion.Eligible_categories) && promotion.Eligible_categories.length > 0;
  if (hasProductRestrictions || hasCategoryRestrictions) {
    // if we have no cart info at all, cannot determine eligibility
    if (
      (!Array.isArray(cartProductIds) || cartProductIds.length === 0) &&
      (!Array.isArray(cartProductCategories) ||
        cartProductCategories.length === 0)
    ) {
      // prefer product reason when products are defined, else category
      const reason = hasProductRestrictions
        ? "not_eligible_product"
        : "not_eligible_category";
      return {
        valid: false,
        reason,
        discountAmount: 0,
        freeDelivery: false,
        promotionName: promotion.Name,
      };
    }

    let hasEligibleProduct = false;
    let hasEligibleCategory = false;

    if (hasProductRestrictions) {
      const eligibleProductsSet = new Set(promotion.Eligible_products);
      hasEligibleProduct = Array.isArray(cartProductIds) && cartProductIds.some(id => eligibleProductsSet.has(id));
    }

    if (hasCategoryRestrictions) {
      const eligibleCategoriesSet = new Set(promotion.Eligible_categories);
      hasEligibleCategory = Array.isArray(cartProductCategories) && cartProductCategories.some(cat => eligibleCategoriesSet.has(cat));
    }

    // require at least one match (product OR category)
    if (!hasEligibleProduct && !hasEligibleCategory) {
      // pick a reason depending on which restriction exists
      const reason =
        hasProductRestrictions && !hasCategoryRestrictions
          ? "not_eligible_product"
          : hasCategoryRestrictions && !hasProductRestrictions
          ? "not_eligible_category"
          : "not_eligible_product";
      return { valid: false, reason, discountAmount: 0, freeDelivery: false, promotionName: promotion.Name };
    }
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
        return "ALLOW";
      }
      return "NOT_ALLOW";
    }
    return "ALLOW";
  } catch {
    // if localStorage is not available (server-side tests), allow usage
    return "ALLOW";
  }
}

  export function checkGlobalUsage(promotion: PromotionCode) {
    try {
      if (typeof localStorage === "undefined") return "ALLOW";
      const raw = localStorage.getItem("couponGlobalUsage");
      const counters = raw ? JSON.parse(raw) : {};
      const used = counters[promotion.PromotionCode_id] || 0;
      if (typeof promotion.Global_limit === "number" && used >= promotion.Global_limit) {
        return "NOT_ALLOW";
      }
      return "ALLOW";
    } catch {
      return "ALLOW";
    }
  }
