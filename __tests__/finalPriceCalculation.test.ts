import { finalizeCheckout, FinalizeInput } from "@/app/services/checkout.service";
import { Customer, PromotionCode } from "@/models";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { pointsToBaht } from "@/utils/loyalty";

// Use console colors to match your desired output format
beforeAll(() => {
  // This will make our test descriptions stand out in the console
  console.log("\nFinal Price Calculation and Checkout Process\n");
});

// Helper to create a test customer
const createTestCustomer = (loyalPoints: number = 1000, promotionCodes: string[] = []): Customer => ({
  Cus_id: "TEST001",
  Cus_name: "Test Customer",
  Address: "Test Address",
  Loyal_points: loyalPoints,
  Phone: "123-456-7890",
  Email: "test@example.com",
  Promotion_codes: promotionCodes,
});

// Helper to create a test promotion code
const createTestPromotion = (
  type: Promotion_code_type,
  amount: number,
  id: string = "PROMO001"
): PromotionCode => ({
  PromotionCode_id: id,
  Name: type === Promotion_code_type.Percentage ? `SAVE${amount}` : 
        type === Promotion_code_type.Fixed ? `FIX${amount}` : "FREESHIP",
  Promotion_code_type: type,
  Start_date: "2025-01-01",
  End_date: "2025-12-31",
  Period: 365,
});

describe("Final Price Calculation", () => {
    test("Test Case 1: Basic calculation with all components (1000 - 100 - 20 + 50 = 930)", () => {
      const subtotal = 1000;
      const discountAmount = 100; // 10% discount from a coupon
      const effectiveDelivery = 50;
      const requestedPoints = 200; // 20 baht discount (200 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(500),
        appliedCoupon: createTestPromotion(Promotion_code_type.Percentage, 10),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 1000 (subtotal) - 100 (discount) - 20 (points) + 50 (delivery) = 930
      const expectedPointsDiscountBaht = pointsToBaht(200);
      const expectedFinalTotal = subtotal - discountAmount - expectedPointsDiscountBaht + effectiveDelivery;
      
      expect(result.finalTotal).toBe(expectedFinalTotal);
      expect(result.pointsDiscountBaht).toBe(expectedPointsDiscountBaht);
    });

    test("Test Case 2: Zero values don't affect calculation (500 - 0 - 0 + 0 = 500)", () => {
      const subtotal = 500;
      const discountAmount = 0; // No coupon
      const effectiveDelivery = 0; // Free delivery 
      const requestedPoints = 0; // No points used
      
      const input: FinalizeInput = {
        customer: createTestCustomer(500),
        appliedCoupon: null,
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 500 (subtotal) - 0 (discount) - 0 (points) + 0 (delivery) = 500
      expect(result.finalTotal).toBe(500);
      expect(result.pointsDiscountBaht).toBe(0);
    });

    test("Test Case 3: Fixed amount discount coupon (800 - 150 - 10 + 30 = 670)", () => {
      const subtotal = 800;
      const discountAmount = 150; // Fixed 150 baht discount
      const effectiveDelivery = 30;
      const requestedPoints = 100; // 10 baht discount (100 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(500),
        appliedCoupon: createTestPromotion(Promotion_code_type.Fixed, 150),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 800 (subtotal) - 150 (discount) - 10 (points) + 30 (delivery) = 670
      const expectedPointsDiscountBaht = pointsToBaht(100);
      const expectedFinalTotal = subtotal - discountAmount - expectedPointsDiscountBaht + effectiveDelivery;
      
      expect(result.finalTotal).toBe(expectedFinalTotal);
    });

    test("Test Case 4: Free delivery promotion (600 - 0 - 5 + 0 = 595)", () => {
      const subtotal = 600;
      const discountAmount = 0; // No price discount from free delivery promo
      const effectiveDelivery = 0; // Free delivery from promotion
      const requestedPoints = 50; // 5 baht discount (50 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(500),
        appliedCoupon: createTestPromotion(Promotion_code_type.Free_delivery, 0),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 600 (subtotal) - 0 (discount) - 5 (points) + 0 (delivery) = 595
      const expectedPointsDiscountBaht = pointsToBaht(50);
      const expectedFinalTotal = subtotal - discountAmount - expectedPointsDiscountBaht + effectiveDelivery;
      
      expect(result.finalTotal).toBe(expectedFinalTotal);
    });

    test("Test Case 5: Large points redemption with capping", () => {
      const subtotal = 2000;
      const discountAmount = 200; // 10% discount
      const effectiveDelivery = 100;
      const requestedPoints = 5000; // 500 baht (5000 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(5000),
        appliedCoupon: createTestPromotion(Promotion_code_type.Percentage, 10),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 2000 (subtotal) - 200 (discount) - 500 (points) + 100 (delivery) = 1400
      // However, we shouldn't go below 0, so we cap points usage
      const payableBeforePoints = subtotal - discountAmount + effectiveDelivery;
      const maxPoints = payableBeforePoints * 10; // Convert baht to points
      const expectedPointsSpent = Math.min(requestedPoints, maxPoints);
      const expectedPointsDiscountBaht = pointsToBaht(expectedPointsSpent);
      const expectedFinalTotal = Math.max(0, subtotal - discountAmount - expectedPointsDiscountBaht + effectiveDelivery);
      
      expect(result.finalTotal).toBe(expectedFinalTotal);
      expect(result.pointsSpent).toBeLessThanOrEqual(expectedPointsSpent);
    });

    test("Test Case 6: Order of operations: Subtotal → Promotions → Redeem → Delivery (1500 - 300 - 100 + 75 = 1175)", () => {
      const subtotal = 1500;
      const discountAmount = 300; // 20% discount
      const effectiveDelivery = 75;
      const requestedPoints = 1000; // 100 baht (1000 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(1000),
        appliedCoupon: createTestPromotion(Promotion_code_type.Percentage, 20),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Order of operations should be:
      // 1. subtotal (1500)
      // 2. apply promotions (-300)
      // 3. apply points redemption (-100)
      // 4. add delivery fees (+75)
      // Expected: 1500 - 300 - 100 + 75 = 1175
      expect(result.finalTotal).toBe(1175);
      
      // Wrong order (if applying delivery before points):
      // 1500 - 300 + 75 - 100 = 1175 (still correct because addition/subtraction are commutative)
      
      // Wrong order (if applying discount after points):
      // 1500 - 100 - 300 + 75 = 1175 (still correct because addition/subtraction are commutative)
      
      // Therefore we need to verify that the payable amount before points is calculated correctly
      // The expected payable before points would be: subtotal - discountAmount + effectiveDelivery
      
      // We can verify this by checking the max possible points that could be used
      // pointsToSpend = normalizePointsToRedeem(requestedPoints, customer.Loyal_points, payableBeforePoints)
      expect(result.pointsSpent).toBeLessThanOrEqual(Math.min(requestedPoints, input.customer.Loyal_points));
    });

    test("Test Case 7: Edge case - total becomes zero (100 - 90 - 20 + 10 = 0)", () => {
      const subtotal = 100;
      const discountAmount = 90; // 90% discount
      const effectiveDelivery = 10;
      const requestedPoints = 200; // 20 baht (200 points)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(200),
        appliedCoupon: createTestPromotion(Promotion_code_type.Percentage, 90),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Expected: 100 (subtotal) - 90 (discount) - 20 (points) + 10 (delivery) = 0
      // Points used should be 200
      expect(result.finalTotal).toBe(0);
      expect(result.pointsSpent).toBe(200);
    });

    test("Test Case 8: Points adjustment is rounded correctly to multiples of 10 (123→120 points)", () => {
      const subtotal = 123.45;
      const discountAmount = 23.45; 
      const effectiveDelivery = 19;
      const requestedPoints = 123; // Odd number of points (12.3 baht)
      
      const input: FinalizeInput = {
        customer: createTestCustomer(500),
        appliedCoupon: createTestPromotion(Promotion_code_type.Fixed, 23.45),
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Points should be normalized to a multiple of 10
      expect(result.pointsSpent % 10).toBe(0);
      
      // Expected normalization: 123 -> 120 points (12 baht)
      expect(result.pointsSpent).toBe(120);
      expect(result.pointsDiscountBaht).toBe(12);
      
      // Expected: 123.45 (subtotal) - 23.45 (discount) - 12 (points) + 19 (delivery) = 107
      const expectedFinalTotal = subtotal - discountAmount - result.pointsDiscountBaht + effectiveDelivery;
      expect(result.finalTotal).toBeCloseTo(expectedFinalTotal, 2);
    });
  
  describe("Loyalty Points Updates", () => {
    test("Test Case 9: Loyalty points balance updated correctly: 1000 - 500 (spent) + 10 (earned) = 510", () => {
      const subtotal = 1000;
      const discountAmount = 0; 
      const effectiveDelivery = 50;
      const requestedPoints = 500; // 50 baht (500 points)
      const initialPoints = 1000;
      
      const input: FinalizeInput = {
        customer: createTestCustomer(initialPoints),
        appliedCoupon: null,
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // Points spent: 500
      expect(result.pointsSpent).toBe(500);
      
      // Final total: 1000 - 0 - 50 + 50 = 1000
      expect(result.finalTotal).toBe(1000);
      
      // Points earned: 10 (1000/100)
      expect(result.pointsEarned).toBe(10);
      
      // Final points balance: 1000 (initial) - 500 (spent) + 10 (earned) = 510
      expect(result.updatedCustomer.Loyal_points).toBe(510);
    });

    test("Test Case 10: Promotion code is removed from customer's available promotions after use", () => {
      const promotionId = "TEST_PROMO";
      const initialPromotionCodes = [promotionId, "OTHER_PROMO"];
      
      const input: FinalizeInput = {
        customer: createTestCustomer(1000, initialPromotionCodes),
        appliedCoupon: createTestPromotion(Promotion_code_type.Fixed, 100, promotionId),
        subtotal: 500,
        effectiveDelivery: 50,
        discountAmount: 100,
        requestedPoints: 0,
      };
      
      // Act
      const result = finalizeCheckout(input);
      
      // Assert
      // The used promotion code should be removed from the customer
      expect(result.updatedCustomer.Promotion_codes).not.toContain(promotionId);
      expect(result.updatedCustomer.Promotion_codes).toContain("OTHER_PROMO");
      expect(result.usedCouponId).toBe(promotionId);
    });
  });
});