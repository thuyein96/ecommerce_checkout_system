import { DELIVERY_FEES } from "./helpers";
import { CartItem } from "../context/CartContext";
import { Product } from "../models/product";

/**
 * Gets current product data from API
 */
export const getCurrentProductsData = async (): Promise<Product[]> => {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error("Failed to fetch products from API:", error);
    // Fallback to static import if API fails
    const productsData = await import("../data/products.json");
    return [...productsData.default] as Product[];
  }
};

/**
 * Gets a product by ID from current data
 */
export const getProductById = async (
  productId: string
): Promise<Product | undefined> => {
  const products = await getCurrentProductsData();
  return products.find((p) => p.product_id === productId);
};

/**
 * Reduces product stock quantities after successful payment using API
 * @param cartItems - Array of cart items to reduce stock for
 * @returns Promise<boolean> indicating success
 */
export const reduceProductStock = async (
  cartItems: CartItem[]
): Promise<boolean> => {
  try {
    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      console.log("No items to process for stock reduction");
      return true;
    }

    // Call the API to reduce stock
    const response = await fetch("/api/products/reduce-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cartItems }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API error:", errorData.error);
      return false;
    }

    const result = await response.json();
    console.log("Stock update completed via API:", result.updates);
    return true;
  } catch (error) {
    console.error("Failed to reduce product stock via API:", error);
    return false;
  }
};

/**
 * Validates that an order can be fulfilled based on current stock levels
 * @param cartItems - Items to validate
 * @returns Promise with validation result and any issues
 */
export const validateOrderFulfillment = async (
  cartItems: CartItem[]
): Promise<{
  canFulfill: boolean;
  issues: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
}> => {
  const issues: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }> = [];

  // Get current products data
  const products = await getCurrentProductsData();

  for (const item of cartItems) {
    const product = products.find(
      (p: Product) => p.product_id === item.product.product_id
    );
    if (!product) {
      issues.push({
        productId: item.product.product_id,
        productName: item.product.product_name,
        requested: item.quantity,
        available: 0,
      });
    } else if (item.quantity > product.instock_Quantity) {
      issues.push({
        productId: item.product.product_id,
        productName: item.product.product_name,
        requested: item.quantity,
        available: product.instock_Quantity,
      });
    }
  }

  return {
    canFulfill: issues.length === 0,
    issues,
  };
};

/**
 * Processes post-payment operations including stock reduction and loyalty updates
 * @param cartItems - Items purchased
 * @param customerId - Customer ID
 * @param pointsSpent - Points used in transaction
 * @param pointsEarned - Points earned from purchase
 * @param usedCouponId - Coupon ID if used
 * @returns Promise with operation results
 */
export const processPostPayment = async (
  cartItems: CartItem[],
  customerId: string,
  pointsSpent: number,
  pointsEarned: number,
  usedCouponId?: string
): Promise<{
  success: boolean;
  stockUpdateSuccess: boolean;
  validationIssues?: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
  errors?: string[];
}> => {
  const errors: string[] = [];

  try {
    // First validate that the order can be fulfilled
    const validation = await validateOrderFulfillment(cartItems);
    if (!validation.canFulfill) {
      console.warn("Order fulfillment validation failed:", validation.issues);
      // Don't fail the payment, but log the issues for monitoring
      // In a real application, this validation should happen before payment
    }

    // Reduce product stock
    const stockUpdateSuccess = await reduceProductStock(cartItems);

    if (!stockUpdateSuccess) {
      errors.push("Failed to update product stock");
    }

    // In a real application, you would also:
    // 1. Create order record in database
    // 2. Send confirmation email
    // 3. Update analytics/reporting
    // 4. Trigger inventory alerts if stock is low
    // 5. Update customer purchase history

    console.log("Post-payment processing completed:", {
      customerId,
      pointsSpent,
      pointsEarned,
      usedCouponId,
      stockUpdateSuccess,
    });

    return {
      success: errors.length === 0,
      stockUpdateSuccess,
      validationIssues: validation.canFulfill ? undefined : validation.issues,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Post-payment processing failed:", error);
    return {
      success: false,
      stockUpdateSuccess: false,
      errors: ["Post-payment processing failed"],
    };
  }
};

/**
 * Calculates delivery fees based on cart items and delivery methods per shop
 * @param cartItems - Array of cart items
 * @param deliveryMethods - Record of delivery methods per shop (shopId -> method)
 * @returns Object containing total delivery fees and shop groups
 */
export const calculateDeliveryFees = (
  cartItems: CartItem[],
  deliveryMethods: Record<string, "standard" | "priority">
) => {
  // Group items by shop
  const shopGroups: Record<string, CartItem[]> = {};
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const shopId = item.product.shop_id;
    if (!shopGroups[shopId]) {
      shopGroups[shopId] = [];
    }
    shopGroups[shopId].push(item);
  }

  // Calculate delivery fee per shop (one fee per shop regardless of items count)
  let totalDeliveryFees = 0;
  const shopIds = Object.keys(shopGroups);
  for (let i = 0; i < shopIds.length; i++) {
    const shopId = shopIds[i];
    // Get the delivery method for this shop
    const shopDeliveryMethod = deliveryMethods[shopId] || "standard";
    totalDeliveryFees += DELIVERY_FEES[shopDeliveryMethod];
  }

  return { totalDeliveryFees, shopGroups };
};

/**
 * Calculates subtotal from cart items
 * @param cartItems - Array of cart items
 * @returns The subtotal amount
 */
export const calculateSubtotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
};
