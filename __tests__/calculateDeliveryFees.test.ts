import { calculateDeliveryFees } from "../src/utils/checkout";
import { CartItem } from "../src/context/CartContext";
import { DELIVERY_FEES } from "../src/utils/helpers";

// Mock cart items for testing
const createMockCartItem = (
  productId: string,
  shopId: string,
  price: number,
  quantity: number
): CartItem => ({
  product: {
    product_id: productId,
    product_name: `Product ${productId}`,
    price: price,
    shop_id: shopId,
    image: `image${productId}.jpg`,
    review: 4.5,
    instock_Quantity: 10,
    product_category: "Category",
  },
  quantity: quantity,
});

describe("calculateDeliveryFees Function Tests", () => {
  describe("Test Case 1: Single Shop Standard Delivery", () => {
    it("should calculate 19 THB for 1 shop with standard delivery", () => {
      // Arrange
      const cartItems = [createMockCartItem("p1", "shop1", 100, 2)];
      const deliveryMethods = { shop1: "standard" as const };

      // Act
      const result = calculateDeliveryFees(cartItems, deliveryMethods);

      // Assert
      expect(result.totalDeliveryFees).toBe(19);
      expect(result.shopGroups).toEqual({
        shop1: [cartItems[0]],
      });
    });
  });

  describe("Test Case 2: Single Shop Priority Delivery", () => {
    it("should calculate 29 THB for 1 shop with priority delivery", () => {
      // Arrange
      const cartItems = [createMockCartItem("p1", "shop1", 100, 1)];
      const deliveryMethods = { shop1: "priority" as const };

      // Act
      const result = calculateDeliveryFees(cartItems, deliveryMethods);

      // Assert
      expect(result.totalDeliveryFees).toBe(29);
      expect(result.shopGroups).toEqual({
        shop1: [cartItems[0]],
      });
    });
  });

  describe("Test Case 3: Multiple Shop Standard Delivery", () => {
    it("should calculate 57 THB (19 × 3) for 3 shops with standard delivery", () => {
      // Arrange
      const cartItems = [
        createMockCartItem("p1", "shop1", 100, 1),
        createMockCartItem("p2", "shop2", 150, 2),
        createMockCartItem("p3", "shop3", 200, 1),
      ];
      const deliveryMethods = {
        shop1: "standard" as const,
        shop2: "standard" as const,
        shop3: "standard" as const,
      };

      // Act
      const result = calculateDeliveryFees(cartItems, deliveryMethods);

      // Assert
      expect(result.totalDeliveryFees).toBe(57); // 19 * 3
      expect(Object.keys(result.shopGroups)).toHaveLength(3);
      expect(result.shopGroups.shop1).toContain(cartItems[0]);
      expect(result.shopGroups.shop2).toContain(cartItems[1]);
      expect(result.shopGroups.shop3).toContain(cartItems[2]);
    });
  });

  describe("Test Case 4: Multiple Shop Priority Delivery", () => {
    it("should calculate 87 THB (29 × 3) for 3 shops with priority delivery", () => {
      // Arrange
      const cartItems = [
        createMockCartItem("p1", "shop1", 100, 1),
        createMockCartItem("p2", "shop2", 150, 2),
        createMockCartItem("p3", "shop3", 200, 1),
      ];
      const deliveryMethods = {
        shop1: "priority" as const,
        shop2: "priority" as const,
        shop3: "priority" as const,
      };

      // Act
      const result = calculateDeliveryFees(cartItems, deliveryMethods);

      // Assert
      expect(result.totalDeliveryFees).toBe(87); // 29 * 3
      expect(Object.keys(result.shopGroups)).toHaveLength(3);
      expect(result.shopGroups.shop1).toContain(cartItems[0]);
      expect(result.shopGroups.shop2).toContain(cartItems[1]);
      expect(result.shopGroups.shop3).toContain(cartItems[2]);
    });
  });

  describe("Test Case 5: Mixed Delivery Types", () => {
    it("should calculate 48 THB (19 + 29) for Shop 1 Standard + Shop 2 Priority", () => {
      // Arrange
      const cartItems = [
        createMockCartItem("p1", "shop1", 100, 1),
        createMockCartItem("p2", "shop2", 150, 2),
      ];
      const deliveryMethods = {
        shop1: "standard" as const,
        shop2: "priority" as const,
      };

      // Act
      const result = calculateDeliveryFees(cartItems, deliveryMethods);

      // Assert
      expect(result.totalDeliveryFees).toBe(48); // 19 + 29
      expect(Object.keys(result.shopGroups)).toHaveLength(2);
      expect(result.shopGroups.shop1).toContain(cartItems[0]);
      expect(result.shopGroups.shop2).toContain(cartItems[1]);
    });
  });

  describe("Delivery Fee Constants Verification", () => {
    it("should use correct THB delivery fee amounts", () => {
      expect(DELIVERY_FEES.standard).toBe(19.0);
      expect(DELIVERY_FEES.priority).toBe(29.0);
    });
  });
});
