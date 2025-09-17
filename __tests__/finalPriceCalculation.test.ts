import { computeFinalPrice } from "@/utils/checkout";

describe("Final Price Calculation", () => {
  test("Test Case 1: No Discounts, No Redeem", () => {
    const total = computeFinalPrice(100, 0, 0, 20);
    expect(total).toBe(120);
  });

  test("Test Case 2: With Coupon Only", () => {
    const total = computeFinalPrice(200, 50, 0, 30);
    expect(total).toBe(180);
  });

  test("Test Case 3: With Redeem Only", () => {
    const total = computeFinalPrice(150, 0, 40, 19);
    expect(total).toBe(129);
  });

  test("Test Case 4: Coupon + Redeem", () => {
    const total = computeFinalPrice(300, 60, 50, 29);
    expect(total).toBe(219);
  });

  test("Test Case 5: Coupon Greater than Subtotal (Cap at Subtotal)", () => {
    const total = computeFinalPrice(80, 100, 20, 19);
    expect(total).toBe(19);
  });

  test("Test Case 6: Redeem Greater than Remaining Subtotal (Cap at Remaining)", () => {
    const total = computeFinalPrice(120, 20, 200, 30);
    expect(total).toBe(30);
  });

  test("Test Case 7: Zero Delivery Fees", () => {
    const total = computeFinalPrice(90, 10, 20, 0);
    expect(total).toBe(60);
  });

  test("Test Case 8: Large Values", () => {
    const total = computeFinalPrice(1000, 200, 300, 50);
    expect(total).toBe(550);
  });
});
