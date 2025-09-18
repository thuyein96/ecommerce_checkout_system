import { DELIVERY_FEES } from "./helpers";
import { CartItem } from "../context/CartContext";

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
