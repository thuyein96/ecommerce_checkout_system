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
  const shopGroups = cartItems.reduce((groups, item) => {
    const shopId = item.product.shop_id;
    if (!groups[shopId]) {
      groups[shopId] = [];
    }
    groups[shopId].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

  // Calculate delivery fee per shop (one fee per shop regardless of items count)
  let totalDeliveryFees = 0;
  Object.entries(shopGroups).forEach(([shopId, items]) => {
    // Get the delivery method for this shop
    const shopDeliveryMethod = deliveryMethods[shopId] || "standard";
    totalDeliveryFees += DELIVERY_FEES[shopDeliveryMethod];
  });

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
