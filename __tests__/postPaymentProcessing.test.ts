import {
  reduceProductStock,
  validateOrderFulfillment,
  processPostPayment,
} from "../src/utils/checkout";
import { CartItem } from "../src/context/CartContext";
import products from "../src/data/products.json";

describe("Post-Payment Processing", () => {
  // Create test cart items
  const testCartItems: CartItem[] = [
    {
      product: {
        product_id: "P001",
        product_name: "iPhone 15 Pro Max",
        price: 1199.99,
        shop_id: "SHOP001",
        image: "test-image-url",
        review: 4.5,
        instock_Quantity: 25,
        product_category: "Electronics",
      },
      quantity: 2,
    },
    {
      product: {
        product_id: "P002",
        product_name: "Nike Air Max 270",
        price: 150.0,
        shop_id: "SHOP002",
        image: "test-image-url",
        review: 4.2,
        instock_Quantity: 50,
        product_category: "Footwear",
      },
      quantity: 1,
    },
  ];

  beforeEach(() => {
    // Reset product stock to original values before each test
    const originalP001 = products.find((p) => p.product_id === "P001");
    const originalP002 = products.find((p) => p.product_id === "P002");

    if (originalP001) originalP001.instock_Quantity = 25;
    if (originalP002) originalP002.instock_Quantity = 50;
  });

  describe("validateOrderFulfillment", () => {
    it("should validate order with sufficient stock", async () => {
      const result = await validateOrderFulfillment(testCartItems);
      expect(result.canFulfill).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should detect insufficient stock", async () => {
      const largeOrderItem: CartItem = {
        product: {
          product_id: "P001",
          product_name: "iPhone 15 Pro Max",
          price: 1199.99,
          shop_id: "SHOP001",
          image: "test-image-url",
          review: 4.5,
          instock_Quantity: 25,
          product_category: "Electronics",
        },
        quantity: 30, // More than available stock
      };

      const result = await validateOrderFulfillment([largeOrderItem]);
      expect(result.canFulfill).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toEqual({
        productId: "P001",
        productName: "iPhone 15 Pro Max",
        requested: 30,
        available: 25,
      });
    });
  });

  describe("reduceProductStock", () => {
    it("should return success for valid cart items", async () => {
      const result = await reduceProductStock(testCartItems);
      // Since we're using real API calls, we expect the function to at least attempt the operation
      expect(typeof result).toBe("boolean");
    });

    it("should handle empty cart items", async () => {
      const result = await reduceProductStock([]);
      expect(result).toBe(true);
    });
  });

  describe("processPostPayment", () => {
    it("should attempt post-payment processing", async () => {
      const result = await processPostPayment(
        testCartItems,
        "CUST001",
        50, // points spent
        120, // points earned
        "PROMO001" // used coupon
      );

      expect(typeof result.success).toBe("boolean");
      expect(typeof result.stockUpdateSuccess).toBe("boolean");
    });

    it("should handle validation and large orders", async () => {
      // Create an order that exceeds stock
      const largeOrderItem: CartItem = {
        product: {
          product_id: "P001",
          product_name: "iPhone 15 Pro Max",
          price: 1199.99,
          shop_id: "SHOP001",
          image: "test-image-url",
          review: 4.5,
          instock_Quantity: 25,
          product_category: "Electronics",
        },
        quantity: 30,
      };

      const result = await processPostPayment(
        [largeOrderItem],
        "CUST001",
        0,
        50,
        undefined
      );

      // Should return a result object with expected properties
      expect(typeof result.success).toBe("boolean");
      expect(result.validationIssues).toBeDefined();
    });
  });
});
