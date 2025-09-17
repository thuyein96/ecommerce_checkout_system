import { PromotionCode } from "@/models";
import promotion_codes from "@/data/promotion_codes.json";

export function isCouponExpired(coupon: PromotionCode, now: Date = new Date()) {
  const start = new Date(coupon.Start_date);
  const end = new Date(coupon.End_date);
  return now < start || now > end;
}

// format rule: only uppercase letters & digits and optional Ccap tokens
/**
 * Checks if the promotion code name is in the correct format.
 * The format should contain only uppercase letters, digits, and optional 'Ccap' tokens.
 * @param codeName - The promotion code name to validate.
 * @returns {boolean} - Returns true if the format is correct, false otherwise.
 */
export function isFormatIncorrect(codeName: string) {
    return !/^[A-Z0-9C]+$/.test(codeName)
}

export function isNotExist(coupon: PromotionCode) {
    return promotion_codes.findIndex(p => p.PromotionCode_id === coupon.PromotionCode_id) === -1;
}

export function isExceededGlobalLimit(coupon: PromotionCode, globalUsageLogs: string) : boolean {
    if (typeof coupon.Global_limit !== "number") return false;
    let counters: Record<string, number> = {};
    if (globalUsageLogs && globalUsageLogs.trim() !== "") {
        try {
            counters = JSON.parse(globalUsageLogs);
        } catch {
            counters = {};
        }
    }
    const usageCount = counters[coupon.PromotionCode_id] || 0;
    return usageCount >= coupon.Global_limit;
}

export function isExceededUserLimit(coupon: PromotionCode, customerId: string, userUsageLogs: string) : boolean {
    let logs: Record<string, Array<{ coupon: string }>> = {};
    if (userUsageLogs && userUsageLogs.trim() !== "") {
        try {
            logs = JSON.parse(userUsageLogs);
        } catch {
            logs = {};
        }
    }
    const customerLogs = logs[customerId] || [];
    const usedCount = customerLogs.filter((log) => log.coupon === coupon.PromotionCode_id);
    return usedCount.length > 0;
}

export function isNotEligibleForProduct(coupon: PromotionCode, cartProductIds: string[]) : boolean {
    if(!coupon.Eligible_products || coupon.Eligible_products.length === 0) return false;
    return cartProductIds.some(id => coupon.Eligible_products!.includes(id));
}

export function isNotEligibleForCategory(coupon: PromotionCode, cartProductCategories: string[]) : boolean {
    if(!coupon.Eligible_categories || coupon.Eligible_categories.length === 0) return false;
    return cartProductCategories.some(cat => coupon.Eligible_categories!.includes(cat));
}

