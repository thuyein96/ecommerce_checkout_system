import { Order, OrderItem, Customer, Product, PromotionCode } from "@/models";
import { currency } from "@/utils/helpers";

interface OrderSummaryProps {
  order: Order;
  customer: Customer;
  orderItems: OrderItem[];
  products: Product[];
  appliedPromotion?: PromotionCode | null;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  loyaltyPointsUsed: number;
  finalTotal: number;
}

export const OrderSummaryComponent: React.FC<OrderSummaryProps> = ({
  order,
  customer,
  orderItems,
  products,
  appliedPromotion,
  subtotal,
  deliveryFee,
  discountAmount,
  loyaltyPointsUsed,
  finalTotal,
}) => {
  const getProductName = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    return product?.product_name || "Unknown Product";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      {/* Order Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Order ID:</span>
            <span className="ml-2 font-medium">{order.Order_id}</span>
          </div>
          <div>
            <span className="text-gray-600">Customer:</span>
            <span className="ml-2 font-medium">{customer.Cus_name}</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Items ({orderItems.length})</h3>
        <div className="space-y-2">
          {orderItems.map((item) => (
            <div key={item.OrderItem_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getProductName(item.Product_id)}
                </p>
                <p className="text-xs text-gray-500">
                  Qty: {item.Quantity} • {item.Delivery_fee_type}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {currency(item.SubTotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{currency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium">
              {deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                currency(deliveryFee)
              )}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                Discount {appliedPromotion ? `(${appliedPromotion.Name})` : ''}:
              </span>
              <span className="font-medium text-green-600">
                -{currency(discountAmount)}
              </span>
            </div>
          )}

          {loyaltyPointsUsed > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Loyalty Points:</span>
              <span className="font-medium text-green-600">
                -{currency(loyaltyPointsUsed)}
              </span>
            </div>
          )}

          <hr className="my-2" />
          
          <div className="flex justify-between text-base font-bold">
            <span>Total:</span>
            <span className="text-teal-600">{currency(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Promotion Info */}
      {appliedPromotion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-green-800">
              Promotion Applied: {appliedPromotion.Name}
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {appliedPromotion.Promotion_code_type.replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  );
};
