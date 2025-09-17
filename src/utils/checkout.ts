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

/**
 * Compute final price given subtotal, coupon discount, redeem (coins), and delivery fee.
 * - Caps coupon at subtotal
 * - Caps redeem at remaining subtotal after coupon
 * - Ensures total is not negative
 */
export const computeFinalPrice = (
  subtotal: number,
  coupon: number,
  redeem: number,
  delivery: number
): number => {
  const safeSubtotal = Math.max(0, subtotal);
  const safeDelivery = Math.max(0, delivery);
  const appliedCoupon = Math.max(0, Math.min(coupon, safeSubtotal));
  const remainingAfterCoupon = safeSubtotal - appliedCoupon;
  const appliedRedeem = Math.max(0, Math.min(redeem, remainingAfterCoupon));
  const raw = remainingAfterCoupon - appliedRedeem + safeDelivery;
  return Math.max(0, Number(raw.toFixed(2)));
};
