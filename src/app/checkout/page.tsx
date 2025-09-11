"use client";

import { DATA } from "@/data";
import { PromotionCode } from "@/models";
import { DeliveryType } from "@/utils/enum/delivery_types";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { amountFromName, currency, DELIVERY_FEES } from "@/utils/helpers";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

const CheckoutPage: React.FC = () => {
  const { cart } = useCart();

  // Function to calculate delivery fees per shop
  const calculateDeliveryFees = (
    cartItems: typeof cart,
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
    }, {} as Record<string, typeof cart>);

    // Calculate delivery fee per shop (one fee per shop regardless of items count)
    let totalDeliveryFees = 0;
    Object.entries(shopGroups).forEach(([shopId, items]) => {
      // Get the delivery method for this shop
      const shopDeliveryMethod = deliveryMethods[shopId] || "standard";
      totalDeliveryFees += DELIVERY_FEES[shopDeliveryMethod];
    });

    return { totalDeliveryFees, shopGroups };
  };

  // Group cart items by shop for display
  const groupedCartItems = useMemo(() => {
    const groups = cart.reduce((groups, item) => {
      const shopId = item.product.shop_id;
      if (!groups[shopId]) {
        groups[shopId] = [];
      }
      groups[shopId].push(item);
      return groups;
    }, {} as Record<string, typeof cart>);
    return groups;
  }, [cart]);
  const [customerId, setCustomerId] = useState<string>(
    DATA.customers[0].Cus_id
  );
  const [customer, setCustomer] = useState(DATA.customers[0]);
  const [orderId, setOrderId] = useState<string>(DATA.orders[0].Order_id);
  const [order, setOrder] = useState(DATA.orders[0]);
  const [orderItems, setOrderItems] = useState(
    DATA.order_items.filter((p) => p.Order_id === orderId)
  );
  const [promotionCodes, setPromotionCodes] = useState<PromotionCode[]>(
    DATA.promotion_codes
  );
  // Delivery method state for each shop
  const [deliveryMethods, setDeliveryMethods] = useState<
    Record<string, "standard" | "priority">
  >(() => {
    const initial: Record<string, "standard" | "priority"> = {};
    const shops = [...new Set(cart.map((item) => item.product.shop_id))];
    shops.forEach((shopId) => {
      initial[shopId] = "standard";
    });
    return initial;
  });
  // Keep only user action state. Compute totals with useMemo to avoid setState during render.
  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<PromotionCode | null>(
    null
  );
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // subtotal: calculate from cart items
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cart]);

  // delivery total (base fees) based on selected delivery methods per shop
  const totalDeliveryFees = useMemo(() => {
    const { totalDeliveryFees } = calculateDeliveryFees(cart, deliveryMethods);
    return totalDeliveryFees;
  }, [cart, deliveryMethods]);

  // total before discount
  const totalBeforeDiscount = useMemo(
    () => subtotal + totalDeliveryFees,
    [subtotal, totalDeliveryFees]
  );

  // discount derived from applied coupon
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const today = new Date();
    const start = new Date(appliedCoupon.Start_date);
    const end = new Date(appliedCoupon.End_date);
    //if (today < start || today > end) return 0;
    if (appliedCoupon.Promotion_code_type === Promotion_code_type.Percentage) {
      const pct = amountFromName(appliedCoupon.Name) / 100;
      return subtotal * pct;
    }
    if (appliedCoupon.Promotion_code_type === Promotion_code_type.Fixed) {
      return amountFromName(appliedCoupon.Name);
    }
    // Free delivery -> no discount on price; handled by effectiveDelivery
    return 0;
  }, [appliedCoupon, subtotal]);

  // effective delivery after promotions (free-delivery coupon)
  const effectiveDelivery = useMemo(() => {
    if (
      appliedCoupon?.Promotion_code_type === Promotion_code_type.Free_delivery
    )
      return 0;
    return totalDeliveryFees;
  }, [appliedCoupon, totalDeliveryFees]);

  // coins that actually apply (bounded by customer balance and allowed amount)
  const coinsToApply = useMemo(() => {
    const maxByBalance = Math.max(0, customer?.Loyal_points ?? 0);
    const allowedMax = Math.max(
      0,
      subtotal + effectiveDelivery - discountAmount
    );
    return Math.min(coinAmount, maxByBalance, allowedMax);
  }, [coinAmount, customer, subtotal, effectiveDelivery, discountAmount]);

  // final total
  const finalTotal = useMemo(() => {
    const raw = subtotal + effectiveDelivery - discountAmount - coinsToApply;
    return Math.max(0, Number(raw.toFixed(2)));
  }, [subtotal, effectiveDelivery, discountAmount, coinsToApply]);

  // handlers update minimal state only
  function handleApplyCoupon(code: PromotionCode | null) {
    setAppliedCoupon(code);
    setCouponInput(code?.Name ?? "");
  }

  function handleChangeCoins(delta: number) {
    setCoinAmount((prev) => {
      const next = prev + delta;
      const maxBalance = Math.max(0, customer?.Loyal_points ?? 0);
      if (next < 0) return 0;
      if (next > maxBalance) return maxBalance;
      return next;
    });
  }

  function handleDeliveryMethodChange(
    shopId: string,
    method: "standard" | "priority"
  ) {
    setDeliveryMethods((prev) => ({
      ...prev,
      [shopId]: method,
    }));
  }

  // reset coin selection when key data changes
  useEffect(() => {
    setCoinAmount(0);
  }, [orderId, customerId, appliedCoupon]);

  // update delivery methods when cart changes
  useEffect(() => {
    setDeliveryMethods((prev) => {
      const updated: Record<string, "standard" | "priority"> = {};
      const shops = [...new Set(cart.map((item) => item.product.shop_id))];
      shops.forEach((shopId) => {
        updated[shopId] = prev[shopId] || "standard";
      });
      return updated;
    });
  }, [cart]);

  return (
    <div className="mx-auto max-w-md bg-white text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
        <Link
          href="/cart"
          className="rounded-full p-2 hover:bg-gray-100"
          aria-label="Back"
        >
          ←
        </Link>
        <h1 className="text-xl font-semibold">My Cart</h1>
        <div className="ml-auto text-gray-500">🗑️</div>
      </div>

      {/* Address + Delivery banner */}
      <div className="space-y-2 border-b px-4 py-3">
        <div className="flex items-start gap-3">
          <div>📍</div>
          <div className="flex-1">
            <div className="truncate text-sm font-medium">
              {customer.Cus_name}
            </div>
            <div className="truncate text-xs text-gray-500">
              {customer.Address}
            </div>
          </div>
        </div>
      </div>

      {/* Cart items grouped by shop */}
      <div className="divide-y">
        {Object.entries(groupedCartItems).map(([shopId, items]) => (
          <div key={shopId} className="px-4 py-4">
            {/* Shop header */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                🏪 Shop {shopId}
              </span>
              <span className="text-xs text-gray-500">
                ({items.length} item{items.length > 1 ? "s" : ""})
              </span>
            </div>

            {/* Items in this shop */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.product_id}
                  className="flex items-center gap-3"
                >
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <div className="line-clamp-2 text-sm font-medium">
                      {item.product.product_name}
                    </div>
                    <div className="mt-1 text-rose-600">
                      {currency(item.product.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Method Selection for this shop */}
            <div className="mt-4 space-y-2 rounded-md bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-700">
                Delivery Method for this shop:
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`delivery-shop-${shopId}`}
                    value="standard"
                    checked={deliveryMethods[shopId] === "standard"}
                    onChange={() =>
                      handleDeliveryMethodChange(shopId, "standard")
                    }
                    className="text-blue-600"
                  />
                  <span>Standard Delivery</span>
                  <span className="text-gray-500">
                    ({currency(DELIVERY_FEES.standard)} per shop)
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`delivery-shop-${shopId}`}
                    value="priority"
                    checked={deliveryMethods[shopId] === "priority"}
                    onChange={() =>
                      handleDeliveryMethodChange(shopId, "priority")
                    }
                    className="text-blue-600"
                  />
                  <span>Priority Delivery</span>
                  <span className="text-gray-500">
                    ({currency(DELIVERY_FEES.priority)} per shop)
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  Estimated delivery:{" "}
                  {deliveryMethods[shopId] === "standard"
                    ? "3-5 days"
                    : "1-2 days"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupons / Coins rows */}
      <div className="mt-2 divide-y border-y">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span>🏷️</span>
            <div>
              <div className="text-sm font-medium">Coupons and Vouchers</div>
              <div className="text-xs text-gray-500">
                {couponInput ? `${couponInput} applied` : "Enter a coupon code"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="w-32 rounded-md border px-2 py-1 text-sm"
              value={couponInput}
              onChange={(e) => {
                const selectedCode =
                  promotionCodes.find((code) => code.Name === e.target.value) ||
                  null;
                handleApplyCoupon(selectedCode);
              }}
            >
              <option value="">Select promo code</option>
              {promotionCodes.map((code) => (
                <option key={code.Name} value={code.Name}>
                  {code.Name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span>🪙</span>
            <div>
              <div className="text-sm font-medium">Use Loyalty Coins</div>
              <div className="text-xs text-gray-500">
                {customer.Loyal_points} coins available
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleChangeCoins(-1)}
              className="h-8 w-8 rounded-full border text-lg leading-8"
            >
              −
            </button>
            <div className="w-6 text-center text-sm">{coinAmount}</div>
            <button
              onClick={() => handleChangeCoins(+1)}
              className="h-8 w-8 rounded-full border text-lg leading-8"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="space-y-3 border-b px-4 py-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Total Price Before Discount</span>
          <span>{currency(totalBeforeDiscount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Discount</span>
          <span className="text-rose-600">
            {discountAmount > 0 ? `−${currency(discountAmount)}` : currency(0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Delivery Fee</span>
          <span>
            {effectiveDelivery === 0 ? "Free" : currency(effectiveDelivery)}
          </span>
        </div>
        {coinsToApply > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span>Coins Applied</span>
            <span className="text-rose-600">{`−${currency(
              coinsToApply
            )}`}</span>
          </div>
        )}
        <hr />
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span>{currency(finalTotal)}</span>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <span>✔️</span>
          <span>
            {effectiveDelivery === 0
              ? "You get Free Delivery"
              : "Delivery applied"}
          </span>
        </div>

        {note && (
          <div className="rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-700">
            {note}
          </div>
        )}
      </div>

      {/* Footer total + CTA */}
      <div className="sticky bottom-0 z-10 bg-white px-4 pb-4 pt-3 shadow-[0_-6px_12px_-4px_rgba(0,0,0,0.06)]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Total</span>
          <span className="text-lg font-semibold">{currency(finalTotal)}</span>
        </div>
        <div className="space-y-2">
          <Link
            href="/order-summary"
            className="w-full rounded-2xl bg-gray-600 py-3 text-center text-lg font-semibold text-white shadow-md hover:bg-gray-700 block"
          >
            View Order Summary
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
