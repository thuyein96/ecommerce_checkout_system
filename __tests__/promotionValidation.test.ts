import { DATA } from "@/data";
import {
  validatePromotionForCart,
  computeDiscountForCoupon,
  computeEffectiveDelivery,
} from "@/app/services/checkout.service";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { PromotionCode } from "@/models/promotionCode";

describe("Promotion code validation and computation", () => {
  const subtotal = 200; // sample subtotal
  const customerId = DATA.customers[0].Cus_id;

  test("Test Case 1: Valid fixed-amount discount code applies fixed discount", () => {
  const found = DATA.promotion_codes.find((c) => c.Promotion_code_type === Promotion_code_type.Fixed)!;
  const code = found as PromotionCode;
  const res = validatePromotionForCart(code, subtotal, customerId, { now: new Date(code.Start_date) });
    expect(res.valid).toBe(true);
    // discountAmount should equal amount parsed from name but not exceed subtotal
  const discount = computeDiscountForCoupon(code, subtotal);
  expect(discount).toBeGreaterThan(0);
  expect(res.discountAmount).toBe(discount);
  });

  test("Test Case 2: Valid percentage discount code with cap does not exceed cap", () => {
  const code = DATA.promotion_codes.find((c) => c.Promotion_code_type === Promotion_code_type.Percentage)! as PromotionCode;
  const res = validatePromotionForCart(code, subtotal, customerId, { now: new Date(code.Start_date) });
    expect(res.valid).toBe(true);
  // validation result discountAmount enforces cap parsing logic
    expect(res.discountAmount).toBeLessThanOrEqual(subtotal);
    expect(res.discountAmount).toBeGreaterThanOrEqual(0);
    // ensure discount is consistent with computeDiscountForCoupon when no cap present
    // If cap exists in name, ensure res.discountAmount <= cap
    const capMatch = code.Name.match(/C(\d+)/);
    if (capMatch) {
      const cap = Number(capMatch[1]);
      expect(res.discountAmount).toBeLessThanOrEqual(cap);
    }
  });

  test("Test Case 3: Valid free-delivery discount code sets delivery to 0", () => {
  const code = DATA.promotion_codes.find((c) => c.Promotion_code_type === Promotion_code_type.Free_delivery)! as PromotionCode;
  const baseDelivery = 50;
  const res = validatePromotionForCart(code, subtotal, customerId, { now: new Date(code.Start_date) });
    expect(res.valid).toBe(true);
    expect(res.freeDelivery).toBe(true);
  const effective = computeEffectiveDelivery(code, baseDelivery);
    expect(effective).toBe(0);
  });

  test("Test Case 4: Invalid code format is rejected", () => {
  const badCode: PromotionCode = {
      PromotionCode_id: "x",
      Name: "bad-format!",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date().toISOString(),
      End_date: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      Period: 0,
  };
  const res = validatePromotionForCart(badCode, subtotal, customerId, { now: new Date() });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("invalid_format");
  });

  test("Test Case 5: Non-existent code is rejected (null input)", () => {
  const res = validatePromotionForCart(null, subtotal, customerId, { now: new Date() });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("not_found");
  });

  test("Test Case 6: Expired code is rejected", () => {
    // take a real code and set now after its End_date
    const code = DATA.promotion_codes[0];
    const afterExpiry = new Date(new Date(code.End_date).getTime() + 1000 * 60);
  const res = validatePromotionForCart(code, subtotal, customerId, { now: afterExpiry });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("expired");
  });

  test("Test Case 8: Code used beyond per-user limit is rejected when customer already used it", () => {
    // simulate customer having used PROMO001
    const promo = DATA.promotion_codes.find((p) => p.PromotionCode_id === "PROMO001") as PromotionCode;
    const logs: Record<string, Array<{ coupon: string }>> = {};
    logs[customerId] = [{ coupon: promo.PromotionCode_id }];
    // write to localStorage (Jest jsdom environment provides localStorage)
    localStorage.setItem("couponlogs", JSON.stringify(logs));

    const res = validatePromotionForCart(promo, subtotal, customerId, { now: new Date(promo.Start_date) });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("exceeded_usage_limit");

    // cleanup
    localStorage.removeItem("couponlogs");
  });

  test("Test Case 10: Subtotal below minimum cart value is rejected when below Min_spend", () => {
    // use a small subtotal to trigger Min_spend check
    const basePromo = DATA.promotion_codes.find((p) => p.PromotionCode_id === "PROMO001")! as PromotionCode;
    // clone and inject Min_spend because DATA fixture doesn't include Min_spend
    const promo: PromotionCode = { ...basePromo, Min_spend: 100 };
    const smallSubtotal = 50;
    const res = validatePromotionForCart(promo, smallSubtotal, customerId, { now: new Date(promo.Start_date) });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("min_spend_not_met");
  });

  test("Test Case 11: Attempt to apply a second coupon with conflict rule", () => {
    const code = DATA.promotion_codes[0];
    // Pass activePromotionName equal to same code to trigger conflict
  const res = validatePromotionForCart(code, subtotal, customerId, { now: new Date(code.Start_date), activePromotionName: code.Name });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("conflict_with_active_coupon");
  });
});
