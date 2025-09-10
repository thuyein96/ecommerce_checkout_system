"use client";

import { DATA } from "@/data";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { amountFromName, currency, DELIVERY_FEES } from "@/utils/helpers";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";

const OrderSummaryPage: React.FC = () => {
  const [orderId, setOrderId] = useState<string>(DATA.orders[0].Order_id);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  
  // Get order details
  const order = useMemo(() => 
    DATA.orders.find(o => o.Order_id === orderId) || DATA.orders[0], 
    [orderId]
  );
  
  // Get customer details
  const customer = useMemo(() => 
    DATA.customers.find(c => c.Cus_id === order.Cus_id) || DATA.customers[0], 
    [order.Cus_id]
  );
  
  // Get order items
  const orderItems = useMemo(() => 
    DATA.order_items.filter(item => item.Order_id === orderId), 
    [orderId]
  );
  
  // Get applied promotion code
  const appliedPromotion = useMemo(() => 
    order.coupon ? DATA.promotion_codes.find(promo => promo.Name === order.coupon) : null, 
    [order.coupon]
  );

  // Calculate subtotal
  const subtotal = useMemo(() => 
    orderItems.reduce((sum, item) => sum + item.SubTotal, 0), 
    [orderItems]
  );

  // Calculate delivery fees
  const totalDeliveryFees = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const fee = DELIVERY_FEES[item.Delivery_fee_type as keyof typeof DELIVERY_FEES] ?? 0;
      return sum + fee;
    }, 0);
  }, [orderItems]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!appliedPromotion) return 0;
    
    if (appliedPromotion.Promotion_code_type === Promotion_code_type.Percentage) {
      const pct = amountFromName(appliedPromotion.Name) / 100;
      return subtotal * pct;
    }
    if (appliedPromotion.Promotion_code_type === Promotion_code_type.Fixed) {
      return amountFromName(appliedPromotion.Name);
    }
    return 0;
  }, [appliedPromotion, subtotal]);

  // Calculate effective delivery (after free delivery promotion)
  const effectiveDelivery = useMemo(() => {
    if (appliedPromotion?.Promotion_code_type === Promotion_code_type.Free_delivery) return 0;
    return totalDeliveryFees;
  }, [appliedPromotion, totalDeliveryFees]);

  // Calculate loyalty points used
  const loyaltyPointsUsed = order.loyalty_points || 0;

  // Calculate final total
  const finalTotal = useMemo(() => {
    const total = subtotal + effectiveDelivery - discountAmount - loyaltyPointsUsed;
    return Math.max(0, Number(total.toFixed(2)));
  }, [subtotal, effectiveDelivery, discountAmount, loyaltyPointsUsed]);

  return (
    <div className="mx-auto max-w-2xl bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/checkout" className="rounded-full p-2 hover:bg-gray-100" aria-label="Back">
          ←
        </Link>
        <h1 className="text-xl font-semibold">Order Summary</h1>
      </div>

      {/* Order Selection */}
      <div className="border-b px-4 py-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Order to View
        </label>
        <select
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {DATA.orders.map((order) => (
            <option key={order.Order_id} value={order.Order_id}>
              {order.Order_id} - {DATA.customers.find(c => c.Cus_id === order.Cus_id)?.Cus_name}
            </option>
          ))}
        </select>
      </div>

      {/* Order Information */}
      <div className="px-4 py-4 border-b">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Details</h2>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Order ID:</span>
              <span className="text-sm font-medium">{order.Order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer:</span>
              <span className="text-sm font-medium">{customer.Cus_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Delivery Address:</span>
              <span className="text-sm font-medium text-right">{customer.Address}</span>
            </div>
            {order.coupon && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Promo Code:</span>
                <span className="text-sm font-medium text-green-600">{order.coupon}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Items Ordered</h3>
        <div className="space-y-3">
          {orderItems.map((item) => {
            const product = DATA.products.find(p => p.product_id === item.Product_id);
            return (
              <div key={item.OrderItem_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">IMG</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {product?.product_name || "Unknown Product"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Quantity: {item.Quantity} • Delivery: {item.Delivery_fee_type}
                  </p>
                  <p className="text-sm font-semibold text-teal-600 mt-1">
                    {currency(item.SubTotal)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Price Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal ({orderItems.length} items)</span>
            <span className="font-medium">{currency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-medium">
              {effectiveDelivery === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                currency(effectiveDelivery)
              )}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Discount ({appliedPromotion?.Name})
              </span>
              <span className="font-medium text-green-600">
                -{currency(discountAmount)}
              </span>
            </div>
          )}

          {loyaltyPointsUsed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Loyalty Points Used</span>
              <span className="font-medium text-green-600">
                -{currency(loyaltyPointsUsed)}
              </span>
            </div>
          )}

          <hr className="my-3" />
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-teal-600">{currency(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Promotion Details */}
      {appliedPromotion && (
        <div className="px-4 py-4 border-b">
          <h3 className="text-lg font-semibold mb-3">Applied Promotion</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium text-green-800">{appliedPromotion.Name}</span>
            </div>
            <p className="text-sm text-green-700">
              Type: {appliedPromotion.Promotion_code_type.replace('_', ' ')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Valid: {appliedPromotion.Start_date} to {appliedPromotion.End_date}
            </p>
          </div>
        </div>
      )}

      {/* Customer Loyalty Info */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Loyalty Information</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-700">Available Loyalty Points:</span>
            <span className="font-medium text-blue-800">{customer.Loyal_points} coins</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Points Used in This Order:</span>
            <span className="font-medium text-blue-800">{loyaltyPointsUsed} coins</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-blue-700">Remaining Points:</span>
            <span className="font-medium text-blue-800">{customer.Loyal_points - loyaltyPointsUsed} coins</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6">
        <div className="space-y-3">
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
          >
            Proceed to Payment - {currency(finalTotal)}
          </button>
          <Link 
            href="/checkout"
            className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium text-center block hover:bg-teal-700 transition-colors"
          >
            Back to Checkout
          </Link>
          <button 
            onClick={() => window.print()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Print Order Summary
          </button>
        </div>
      </div>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderTotal={currency(finalTotal)}
        orderId={order.Order_id}
      />
    </div>
  );
};

export default OrderSummaryPage;
