"use client";

import { DATA } from "@/data";
import { OrderSummaryComponent } from "@/components/OrderSummary/OrderSummaryComponent";
import { Promotion_code_type } from "@/utils/enum/promotion_code_type";
import { amountFromName, DELIVERY_FEES } from "@/utils/helpers";
import { useMemo } from "react";
import Link from "next/link";

const OrderSummaryDemoPage: React.FC = () => {
  // Use the first order with multiple items for demo
  const demoOrder = DATA.orders[0]; // ORD001
  const customer = DATA.customers.find(c => c.Cus_id === demoOrder.Cus_id)!;
  const orderItems = DATA.order_items.filter(item => item.Order_id === demoOrder.Order_id);
  const appliedPromotion = demoOrder.coupon 
    ? DATA.promotion_codes.find(promo => promo.Name === demoOrder.coupon) 
    : null;

  // Calculate all values
  const subtotal = useMemo(() => 
    orderItems.reduce((sum, item) => sum + item.SubTotal, 0), 
    [orderItems]
  );

  const totalDeliveryFees = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const fee = DELIVERY_FEES[item.Delivery_fee_type as keyof typeof DELIVERY_FEES] ?? 0;
      return sum + fee;
    }, 0);
  }, [orderItems]);

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

  const effectiveDelivery = useMemo(() => {
    if (appliedPromotion?.Promotion_code_type === Promotion_code_type.Free_delivery) return 0;
    return totalDeliveryFees;
  }, [appliedPromotion, totalDeliveryFees]);

  const loyaltyPointsUsed = demoOrder.loyalty_points || 0;

  const finalTotal = useMemo(() => {
    const total = subtotal + effectiveDelivery - discountAmount - loyaltyPointsUsed;
    return Math.max(0, Number(total.toFixed(2)));
  }, [subtotal, effectiveDelivery, discountAmount, loyaltyPointsUsed]);

  return (
    <div className="mx-auto max-w-4xl bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="text-teal-600 hover:text-teal-700">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order Summary Demo</h1>
        </div>
        <p className="text-gray-600">
          This page demonstrates the OrderSummaryComponent with sample data from Order {demoOrder.Order_id}.
        </p>
      </div>

      {/* Demo Component */}
      <div className="mb-6">
        <OrderSummaryComponent
          order={demoOrder}
          customer={customer}
          orderItems={orderItems}
          products={DATA.products}
          appliedPromotion={appliedPromotion}
          subtotal={subtotal}
          deliveryFee={effectiveDelivery}
          discountAmount={discountAmount}
          loyaltyPointsUsed={loyaltyPointsUsed}
          finalTotal={finalTotal}
        />
      </div>

      {/* Demo Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
            <ul className="space-y-1 text-gray-600">
              <li>Order ID: {demoOrder.Order_id}</li>
              <li>Customer: {customer.Cus_name}</li>
              <li>Items: {orderItems.length}</li>
              <li>Applied Coupon: {demoOrder.coupon || 'None'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Calculations</h3>
            <ul className="space-y-1 text-gray-600">
              <li>Subtotal: {subtotal.toFixed(2)} THB</li>
              <li>Delivery Fees: {totalDeliveryFees.toFixed(2)} THB</li>
              <li>Discount: {discountAmount.toFixed(2)} THB</li>
              <li>Loyalty Points: {loyaltyPointsUsed} coins</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex gap-4">
            <Link 
              href="/order-summary"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              View Full Order Summary Page
            </Link>
            <Link 
              href="/checkout"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryDemoPage;
