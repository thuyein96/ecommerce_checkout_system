import { OrderData } from '../src/context/OrderContext';
import { CartItem } from '../src/context/CartContext';
import { DeliveryType } from '../src/utils/enum/delivery_types';
import { Customer, PromotionCode } from '../src/models';
import { Promotion_code_type } from '../src/utils/enum/promotion_code_type';

// Mock cart items for testing
const createMockCartItem = (productId: string, shopId: string, quantity: number = 1): CartItem => ({
    product: {
        product_id: productId,
        product_name: `Product ${productId}`,
        shop_id: shopId,
        price: 100,
        image: "test-image.jpg",
        review: 4.5,
        instock_Quantity: 10,
        product_category: "C001"
    },
    quantity: quantity
});

// Mock shop groups helper
const createMockShopGroups = (shopItemsConfig: Record<string, { productIds: string[], quantities?: number[] }>): Record<string, CartItem[]> => {
    const shopGroups: Record<string, CartItem[]> = {};

    Object.entries(shopItemsConfig).forEach(([shopId, config]) => {
        shopGroups[shopId] = config.productIds.map((productId, index) =>
            createMockCartItem(productId, shopId, config.quantities?.[index] || 1)
        );
    });

    return shopGroups;
};

// Mock complete order data for testing
const createCompleteOrderData = (): OrderData => ({
    orderId: `ORD-${Date.now()}`,
    customer: {
        Cus_id: "CUST001",
        Cus_name: "John Doe",
        Address: "123 Main St, Bangkok, Thailand",
        Loyal_points: 1000,
        Phone: "123-456-7890",
        Email: "john.doe@example.com",
        Promotion_codes: ["SAVE20"]
    } as Customer,
    shopGroups: createMockShopGroups({
        "SHOP001": { productIds: ["P001", "P002"], quantities: [2, 1] },
        "SHOP002": { productIds: ["P003"], quantities: [3] }
    }),
    deliveryMethods: {
        "SHOP001": DeliveryType.STANDARD,
        "SHOP002": DeliveryType.PRIORITY
    },
    appliedCoupon: {
        PromotionCode_id: "PROMO001",
        Name: "SAVE20",
        Promotion_code_type: Promotion_code_type.Percentage,
        Min_spend: 100,
        Max_discount: 50,
        Global_limit: 100,
        Eligible_products: ["P001", "P002"],
        Eligible_categories: ["C001"],
        Start_date: "2024-01-01",
        End_date: "2025-12-31",
        Period: 365
    } as PromotionCode,
    subtotal: 500,
    totalDeliveryFees: 48, // 19 + 29
    effectiveDelivery: 48,
    discountAmount: 100, // 20% of 500
    pointsUsed: 200, // 200 points = 20 baht
    pointsDiscountBaht: 20,
    finalTotal: 428, // 500 + 48 - 100 - 20
    pointsEarned: 40,
    orderDate: new Date().toISOString()
});

// Helper function to simulate order data transfer through OrderContext
const simulateOrderDataTransfer = (originalData: OrderData): OrderData => {
    // Simulate the process: checkout sets data -> OrderContext stores it -> order summary retrieves it
    const serialized = JSON.stringify(originalData);
    return JSON.parse(serialized) as OrderData;
};

describe("Order Data Transfer from Checkout to Order Summary Tests", () => {
    describe("Test Case 1: Complete Order Data Transfer", () => {
        it("should preserve all order data properties during transfer", () => {
            // Arrange
            const originalOrderData = createCompleteOrderData();

            // Act - Simulate data transfer through OrderContext
            const transferredData = simulateOrderDataTransfer(originalOrderData);

            // Assert - Verify all properties are transferred correctly
            expect(transferredData).toEqual(originalOrderData);
            expect(transferredData.orderId).toBe(originalOrderData.orderId);
            expect(transferredData.customer).toEqual(originalOrderData.customer);
            expect(transferredData.shopGroups).toEqual(originalOrderData.shopGroups);
            expect(transferredData.deliveryMethods).toEqual(originalOrderData.deliveryMethods);
            expect(transferredData.appliedCoupon).toEqual(originalOrderData.appliedCoupon);
            expect(transferredData.subtotal).toBe(originalOrderData.subtotal);
            expect(transferredData.totalDeliveryFees).toBe(originalOrderData.totalDeliveryFees);
            expect(transferredData.discountAmount).toBe(originalOrderData.discountAmount);
            expect(transferredData.pointsUsed).toBe(originalOrderData.pointsUsed);
            expect(transferredData.pointsDiscountBaht).toBe(originalOrderData.pointsDiscountBaht);
            expect(transferredData.finalTotal).toBe(originalOrderData.finalTotal);
            expect(transferredData.pointsEarned).toBe(originalOrderData.pointsEarned);
        });
    });

    describe("Test Case 2: Data Type Integrity After Transfer", () => {
        it("should maintain correct data types for all fields", () => {
            // Arrange
            const originalOrderData = createCompleteOrderData();

            // Act
            const transferredData = simulateOrderDataTransfer(originalOrderData);

            // Assert
            expect(typeof transferredData.orderId).toBe('string');
            expect(typeof transferredData.customer).toBe('object');
            expect(typeof transferredData.shopGroups).toBe('object');
            expect(typeof transferredData.deliveryMethods).toBe('object');
            expect(typeof transferredData.appliedCoupon).toBe('object');
            expect(typeof transferredData.subtotal).toBe('number');
            expect(typeof transferredData.totalDeliveryFees).toBe('number');
            expect(typeof transferredData.effectiveDelivery).toBe('number');
            expect(typeof transferredData.discountAmount).toBe('number');
            expect(typeof transferredData.pointsUsed).toBe('number');
            expect(typeof transferredData.pointsDiscountBaht).toBe('number');
            expect(typeof transferredData.finalTotal).toBe('number');
            expect(typeof transferredData.pointsEarned).toBe('number');
            expect(typeof transferredData.orderDate).toBe('string');
            expect(transferredData.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });

    describe("Test Case 3: Pricing Calculations Preservation", () => {
        it("should maintain correct subtotal and final total calculations", () => {
            // Arrange
            const orderData = createCompleteOrderData();

            // Act
            const transferredData = simulateOrderDataTransfer(orderData);

            // Assert
            const expectedFinalTotal = transferredData.subtotal + transferredData.effectiveDelivery -
                transferredData.discountAmount - transferredData.pointsDiscountBaht;
            expect(transferredData.finalTotal).toBe(expectedFinalTotal);
            expect(transferredData.subtotal).toBe(500);
            expect(transferredData.totalDeliveryFees).toBe(48);
            expect(transferredData.effectiveDelivery).toBe(48);
            expect(transferredData.discountAmount).toBe(100);
            expect(transferredData.pointsUsed).toBe(200);
            expect(transferredData.pointsDiscountBaht).toBe(20);
            expect(transferredData.pointsEarned).toBe(40);
            expect(transferredData.finalTotal).toBe(428);
        });
    });

    describe("Test Case 4: Applied Promotion Codes Transfer", () => {
        it("should transfer promotion code details correctly", () => {
            // Arrange
            const orderData = createCompleteOrderData();

            // Act
            const transferredData = simulateOrderDataTransfer(orderData);

            // Assert
            expect(transferredData.appliedCoupon).not.toBeNull();
            expect(transferredData.appliedCoupon?.PromotionCode_id).toBe("PROMO001");
            expect(transferredData.appliedCoupon?.Name).toBe("SAVE20");
            expect(transferredData.appliedCoupon?.Promotion_code_type).toBe(Promotion_code_type.Percentage);
            expect(transferredData.appliedCoupon?.Min_spend).toBe(100);
            expect(transferredData.appliedCoupon?.Max_discount).toBe(50);
            expect(transferredData.appliedCoupon?.Global_limit).toBe(100);
            expect(transferredData.appliedCoupon?.Eligible_products).toEqual(["P001", "P002"]);
            expect(transferredData.appliedCoupon?.Eligible_categories).toEqual(["C001"]);
            expect(transferredData.appliedCoupon?.Start_date).toBe("2024-01-01");
            expect(transferredData.appliedCoupon?.End_date).toBe("2025-12-31");
            expect(transferredData.appliedCoupon?.Period).toBe(365);
            expect(transferredData.discountAmount).toBe(100);
        });
    });

    describe("Test Case 5: Shop Groups and Delivery Methods Transfer", () => {
        it("should transfer shop groups and delivery methods correctly", () => {
            // Arrange
            const orderData = createCompleteOrderData();

            // Act
            const transferredData = simulateOrderDataTransfer(orderData);

            // Assert - Shop Groups
            expect(Object.keys(transferredData.shopGroups)).toEqual(["SHOP001", "SHOP002"]);
            expect(transferredData.shopGroups["SHOP001"]).toHaveLength(2);
            expect(transferredData.shopGroups["SHOP002"]).toHaveLength(1);

            // Verify specific shop items
            expect(transferredData.shopGroups["SHOP001"][0].product.product_id).toBe("P001");
            expect(transferredData.shopGroups["SHOP001"][0].quantity).toBe(2);
            expect(transferredData.shopGroups["SHOP001"][1].product.product_id).toBe("P002");
            expect(transferredData.shopGroups["SHOP001"][1].quantity).toBe(1);
            expect(transferredData.shopGroups["SHOP002"][0].product.product_id).toBe("P003");
            expect(transferredData.shopGroups["SHOP002"][0].quantity).toBe(3);

            // Assert - Delivery Methods
            expect(transferredData.deliveryMethods["SHOP001"]).toBe(DeliveryType.STANDARD);
            expect(transferredData.deliveryMethods["SHOP002"]).toBe(DeliveryType.PRIORITY);
        });
    });

    describe("Test Case 6: No Promotion Codes Scenario", () => {
        it("should handle orders without promotion codes", () => {
            // Arrange
            const orderData = createCompleteOrderData();
            orderData.appliedCoupon = null;
            orderData.discountAmount = 0;
            orderData.finalTotal = 548; // 500 + 48 - 0 - 20

            // Act
            const transferredData = simulateOrderDataTransfer(orderData);

            // Assert
            expect(transferredData.appliedCoupon).toBeNull();
            expect(transferredData.discountAmount).toBe(0);
            expect(transferredData.finalTotal).toBe(548);
            expect(transferredData.subtotal).toBe(500);
            expect(transferredData.totalDeliveryFees).toBe(48);
            expect(transferredData.pointsUsed).toBe(200);
            expect(transferredData.pointsDiscountBaht).toBe(20);
        });
    });
});

describe("Customer Details Validation in Order Summary Tests", () => {
    describe("Test Case 3: Customer Information Display", () => {
        it("should correctly transfer customer details from checkout", () => {
            // Arrange
            const orderData = createCompleteOrderData();

            // Act
            const transferredData = simulateOrderDataTransfer(orderData);

            // Assert
            expect(transferredData.customer.Cus_name).toBe("John Doe");
            expect(transferredData.customer.Address).toBe("123 Main St, Bangkok, Thailand");
            expect(transferredData.customer.Email).toBe("john.doe@example.com");
            expect(transferredData.customer.Phone).toBe("123-456-7890");
            expect(transferredData.customer.Loyal_points).toBe(1000);
        });
    });
});
