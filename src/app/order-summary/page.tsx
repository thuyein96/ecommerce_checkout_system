"use client";

import { useState } from "react";
import Link from "next/link";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { currency } from "@/utils/helpers";
import { DeliveryType } from "@/utils/enum/delivery_types";
import { useOrder } from "@/context/OrderContext";

const OrderSummaryPage: React.FC = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const { currentOrder: orderData, clearCurrentOrder } = useOrder();

  // If no order data, redirect to checkout
  if (!orderData) {
    return (
      <div className="mx-auto max-w-2xl bg-white text-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Order Found</h2>
          <p className="text-gray-600 mb-6">Please complete your checkout first.</p>
          <Link
            href="/checkout"
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Checkout
          </Link>
        </div>
      </div>
    );
  }

  const {
    orderId,
    customer,
    shopGroups, // Use pre-grouped data instead of cart
    deliveryMethods,
    appliedCoupon,
    subtotal,
    effectiveDelivery,
    discountAmount,
    pointsUsed,
    pointsDiscountBaht,
    finalTotal,
    pointsEarned,
    orderDate
  } = orderData; return (
    <div className="mx-auto max-w-2xl bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/checkout" className="rounded-full p-2 hover:bg-gray-100" aria-label="Back">
          ←
        </Link>
        <h1 className="text-xl font-semibold">Order Summary</h1>
      </div>

      {/* Order Information */}
      <div className="px-4 py-4 border-b">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Details</h2>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Order ID:</span>
              <span className="text-sm font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer:</span>
              <span className="text-sm font-medium">{customer.Cus_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Delivery Address:</span>
              <span className="text-sm font-medium text-right">{customer.Address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Order Date:</span>
              <span className="text-sm font-medium">
                {new Date(orderDate).toLocaleDateString()}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Promo Code:</span>
                <span className="text-sm font-medium text-green-600">{appliedCoupon.Name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items by Shop */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Items Ordered</h3>
        <div className="space-y-4">
          {Object.entries(shopGroups).map(([shopId, items]) => (
            <div key={shopId} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  🏪 Shop {shopId}
                </h4>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                  {deliveryMethods[shopId] === DeliveryType.STANDARD ? 'Standard' : 'Priority'} Delivery
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.product_id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.product_name}
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.product.product_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product.product_category}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {currency(item.product.price)} × {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-teal-600 mt-1">
                        {currency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Price Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Subtotal ({Object.values(shopGroups).flat().length} items)
            </span>
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
                Discount ({appliedCoupon?.Name})
              </span>
              <span className="font-medium text-green-600">
                -{currency(discountAmount)}
              </span>
            </div>
          )}

          {pointsUsed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Loyalty Points Used ({pointsUsed} pts)</span>
              <span className="font-medium text-green-600">
                -{currency(pointsDiscountBaht)}
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
      {appliedCoupon && (
        <div className="px-4 py-4 border-b">
          <h3 className="text-lg font-semibold mb-3">Applied Promotion</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium text-green-800">{appliedCoupon.Name}</span>
            </div>
            <p className="text-sm text-green-700">
              Type: {appliedCoupon.Promotion_code_type.replace('_', ' ')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Valid: {appliedCoupon.Start_date} to {appliedCoupon.End_date}
            </p>
          </div>
        </div>
      )}

      {/* Customer Loyalty Info */}
      <div className="px-4 py-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Loyalty Information</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-700">Points Used in This Order:</span>
            <span className="font-medium text-blue-800">{pointsUsed} coins</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Points You&apos;ll Earn:</span>
            <span className="font-medium text-blue-800">{pointsEarned} coins</span>
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
        onClose={() => {
          setIsPaymentModalOpen(false);
          // Clear order data after payment using OrderContext
          clearCurrentOrder();
        }}
        orderTotal={currency(finalTotal)}
        orderId={orderId}
      />
    </div>
  );
};

export default OrderSummaryPage;
