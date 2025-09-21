// Mock only the helper's existence check to avoid JSON dependency
jest.mock("../src/app/services/checkout.helper", () => {
  const actual = jest.requireActual("../src/app/services/checkout.helper");
  return { __esModule: true, ...actual, isNotExist: () => false };
});

import {
  validatePromotionForCart,
  computeDiscountForCoupon,
  computeEffectiveDelivery,
} from "@/app/services/checkout.service";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { PromotionCode } from "@/models";

// Inline mock promotions for testing
const promotion_codes: PromotionCode[] = [
  {
    PromotionCode_id: "PROMO001",
    Name: "F50",
    Promotion_code_type: Promotion_code_type.Fixed,
    Start_date: new Date("2025-01-01").toISOString(),
    End_date: new Date("2026-01-01").toISOString(),
    Period: 0,
    Eligible_products: ["P003"],
    Eligible_categories: ["C003"],
    Global_limit: 1000,
  },
  {
    PromotionCode_id: "PROMO002",
    Name: "P10C100",
    Promotion_code_type: Promotion_code_type.Percentage,
    Start_date: new Date("2025-01-01").toISOString(),
    End_date: new Date("2026-01-01").toISOString(),
    Period: 0,
    Eligible_products: ["P003"],
    Eligible_categories: ["C003"],
    Global_limit: 1,
  },
  {
    PromotionCode_id: "PROMO003",
    Name: "FREESHIP",
    Promotion_code_type: Promotion_code_type.Free_delivery,
    Start_date: new Date("2025-01-01").toISOString(),
    End_date: new Date("2026-01-01").toISOString(),
    Period: 0,
    Eligible_products: ["P005"],
    Eligible_categories: ["C005"],
    Global_limit: 1000,
  },
];

describe("Promotion code validation and computation", () => {
  const subtotal = 200; // sample subtotal
  const customerId = "CUST-TEST-001";

  test("Test Case 1: Valid fixed-amount discount code applies fixed discount", () => {
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F20",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
    } as PromotionCode;
    // ensure cart has at least one product (so eligible checks don't block)
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          product: {
            product_id: (mockPromotion.Eligible_products?.[0] ?? "P003"),
            product_category: (mockPromotion.Eligible_categories?.[0] ?? "C003"),
          },
        },
      ])
    );
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(true);
    // discountAmount should equal amount parsed from name but not exceed subtotal
    const discount = computeDiscountForCoupon(mockPromotion, subtotal);
    expect(discount).toBeGreaterThan(0);
    expect(res.discountAmount).toBe(discount);
    localStorage.removeItem("cart");
  });

  test("Test Case 2: Valid percentage discount code with cap does not exceed cap", () => {
    // Promo code P15C100 means 15% off with max cap of 100
    const mockPromotion = {
      PromotionCode_id: "PROMO002",
      Name: "P15C100",
      Promotion_code_type: Promotion_code_type.Percentage,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1,
  } as PromotionCode;
    // ensure cart contains a matching product/category
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          product: {
            product_id: mockPromotion.Eligible_products
              ? mockPromotion.Eligible_products[0]
              : "P003",
            product_category: mockPromotion.Eligible_categories
              ? mockPromotion.Eligible_categories[0]
              : "C003",
          },
        },
      ])
    );
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(true);
    // validation result discountAmount enforces cap parsing logic
    expect(res.discountAmount).toBeLessThanOrEqual(subtotal);
    expect(res.discountAmount).toBeGreaterThanOrEqual(0);
    // ensure discount is consistent with computeDiscountForCoupon when no cap present
    // If cap exists in name, ensure res.discountAmount <= cap
    const capMatch = mockPromotion.Name.match(/C(\d+)/);
    if (capMatch) {
      const cap = Number(capMatch[1]);
      expect(res.discountAmount).toBeLessThanOrEqual(cap);
    }
    localStorage.removeItem("cart");
  });

  test("Test Case 3: Valid free-delivery discount code sets delivery to 0", () => {
    const mockPromotion = {
      PromotionCode_id: "PROMO003",
      Name: "FREESHIP",
      Promotion_code_type: Promotion_code_type.Free_delivery,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P005"],
      Eligible_categories: ["C005"],
      Global_limit: 1000,
  } as PromotionCode;
    const baseDelivery = 50;
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          product: {
            product_id: mockPromotion.Eligible_products
              ? mockPromotion.Eligible_products[0]
              : "P005",
            product_category: mockPromotion.Eligible_categories
              ? mockPromotion.Eligible_categories[0]
              : "C005",
          },
        },
      ])
    );
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(true);
    expect(res.freeDelivery).toBe(true);
    const effective = computeEffectiveDelivery(mockPromotion, baseDelivery);
    expect(effective).toBe(0);
    localStorage.removeItem("cart");
  });

  test("Test Case 4: Invalid code format is rejected", () => {
    const mockPromotion: PromotionCode = {
      PromotionCode_id: "x",
      Name: "bad-format!",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date().toISOString(),
      End_date: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      Period: 0,
    };
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(),
    });
    expect(res.valid).toBe(false);
    // service first checks membership in fixture list; accept either reason
    expect(["invalid_format", "invalid_code"]).toContain(res.reason);
  });

  test("Test Case 5: Non-existent code is rejected (null input)", () => {
    const res = validatePromotionForCart(null, subtotal, customerId, {
      now: new Date(),
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("not_found");
  });

  test("Test Case 6: Expired code is rejected", () => {
    // take a real code and set now after its End_date
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    const afterExpiry = new Date(new Date(mockPromotion.End_date).getTime() + 1000 * 60);
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: afterExpiry,
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("expired");
  });

  test("Test Case 7: Code used beyond its global limit is rejected", () => {
    const mockPromotion = {
      PromotionCode_id: "PROMO002",
      Name: "P10C100",
      Promotion_code_type: Promotion_code_type.Percentage,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1,
  } as PromotionCode;
    // simulate global counter reached
    localStorage.setItem(
      "couponGlobalUsage",
      JSON.stringify({ [mockPromotion.PromotionCode_id]: mockPromotion.Global_limit || 0 })
    );
    const res = validatePromotionForCart(mockPromotion, 1000, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("exceeded_global_limit");
    localStorage.removeItem("couponGlobalUsage");
  });

  test("Test Case 8: Code used beyond per-user limit is rejected when customer already used it", () => {
    // simulate customer having used PROMO001
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    const logs: Record<string, Array<{ coupon: string }>> = {};
    logs[customerId] = [{ coupon: mockPromotion.PromotionCode_id }];
    // write to localStorage (Jest jsdom environment provides localStorage)
    localStorage.setItem("couponlogs", JSON.stringify(logs));

    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("exceeded_usage_limit");

    // cleanup
    localStorage.removeItem("couponlogs");
  });

  test("Test Case 9a: Promotion with Eligible_products is valid when cart contains an eligible product", () => {
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    // put an eligible product into the cart
    const cart = [
      { product: { product_id: "P003", product_category: "C001" } },
    ];
    localStorage.setItem("cart", JSON.stringify(cart));
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(true);
    localStorage.removeItem("cart");
  });

  test("Test Case 9b: Promotion with Eligible_categories is valid when cart contains a product in eligible category", () => {
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    // put a product whose category matches Eligible_categories but id may be different
    const cart = [
      { product: { product_id: "P999", product_category: "C003" } },
    ];
    localStorage.setItem("cart", JSON.stringify(cart));
    const res = validatePromotionForCart(mockPromotion, subtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(true);
    localStorage.removeItem("cart");
  });

  test("Test Case 10: Subtotal below minimum cart value is rejected when below Min_spend", () => {
    // use a small subtotal to trigger Min_spend check
    const mockPromotion = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Min_spend: 100,
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    const smallSubtotal = 50;
    const res = validatePromotionForCart(mockPromotion, smallSubtotal, customerId, {
      now: new Date(mockPromotion.Start_date),
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("min_spend_not_met");
  });

  test("Test Case 11: Attempt to apply a second coupon with conflict rule", () => {
    const code = {
      PromotionCode_id: "PROMO001",
      Name: "F50",
      Promotion_code_type: Promotion_code_type.Fixed,
      Start_date: new Date("2025-01-01").toISOString(),
      End_date: new Date("2026-01-01").toISOString(),
      Period: 0,
      Eligible_products: ["P003"],
      Eligible_categories: ["C003"],
      Global_limit: 1000,
  } as PromotionCode;
    // Pass activePromotionName equal to same code to trigger conflict
    const res = validatePromotionForCart(code, subtotal, customerId, {
      now: new Date(code.Start_date),
      activePromotionName: code.Name,
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe("conflict_with_active_coupon");
  });
});
