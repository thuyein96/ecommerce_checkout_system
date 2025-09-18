import Link from "next/link";
import { useEffect, useState } from "react";
import { completeOrder } from "@/app/services/checkout.service";
import { CartItem } from "@/context/CartContext";
import { Customer, PromotionCode } from "@/models";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: string;
  orderId: string;
  // New props for post-payment processing
  customer?: Customer;
  appliedCoupon?: PromotionCode | null;
  subtotal?: number;
  effectiveDelivery?: number;
  discountAmount?: number;
  requestedPoints?: number;
  cartItems?: CartItem[];
  onPaymentComplete?: () => void; // Callback for additional actions
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  orderTotal,
  orderId,
  customer,
  appliedCoupon,
  subtotal,
  effectiveDelivery,
  discountAmount,
  requestedPoints,
  cartItems,
  onPaymentComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Process post-payment operations when modal opens
  useEffect(() => {
    if (!isOpen || processingComplete || isProcessing) return;

    // Only process if we have all required data for post-payment operations
    if (
      customer &&
      cartItems &&
      typeof subtotal === "number" &&
      typeof effectiveDelivery === "number" &&
      typeof discountAmount === "number" &&
      typeof requestedPoints === "number"
    ) {
      setIsProcessing(true);
      setProcessingError(null);

      completeOrder({
        customer,
        appliedCoupon: appliedCoupon || null,
        subtotal,
        effectiveDelivery,
        discountAmount,
        requestedPoints,
        cartItems,
      })
        .then((result) => {
          console.log("Post-payment processing completed:", result);

          if (!result.postPaymentSuccess) {
            setProcessingError(
              result.errors?.join(", ") || "Post-payment processing failed"
            );
          } else {
            setProcessingComplete(true);
            // Call additional completion callback if provided
            onPaymentComplete?.();
          }
        })
        .catch((error) => {
          console.error("Post-payment processing error:", error);
          setProcessingError("Failed to process post-payment operations");
        })
        .finally(() => {
          setIsProcessing(false);
        });
    } else {
      // If we don't have the required data, just mark as complete
      setProcessingComplete(true);
    }
  }, [
    isOpen,
    customer,
    cartItems,
    subtotal,
    effectiveDelivery,
    discountAmount,
    requestedPoints,
    appliedCoupon,
    onPaymentComplete,
    processingComplete,
    isProcessing,
  ]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setProcessingComplete(false);
      setProcessingError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl transform transition-all scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <svg
                className="w-10 h-10 text-blue-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            ) : processingError ? (
              <svg
                className="w-10 h-10 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {isProcessing
              ? "Processing Payment..."
              : processingError
              ? "Payment Successful!"
              : "Payment Successful!"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isProcessing ? (
              <>Processing your order and updating inventory...</>
            ) : processingError ? (
              <>
                Your payment of{" "}
                <span className="font-semibold text-green-600">
                  {orderTotal}
                </span>{" "}
                has been processed successfully.
                <br />
                <span className="text-orange-600 text-sm">
                  ⚠️ {processingError}
                </span>
              </>
            ) : (
              <>
                Your payment of{" "}
                <span className="font-semibold text-green-600">
                  {orderTotal}
                </span>{" "}
                has been processed successfully.
              </>
            )}
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="text-lg font-semibold text-gray-900">{orderId}</p>
            <p className="text-xs text-gray-500 mt-2">
              Confirmation email will be sent shortly
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors block text-center shadow-lg ${
                isProcessing
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              onClick={isProcessing ? (e) => e.preventDefault() : onClose}
            >
              🏠 Back to Home
            </Link>
            <Link
              href="/products"
              className={`w-full py-3 px-4 rounded-xl font-medium transition-colors block text-center ${
                isProcessing
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={isProcessing ? (e) => e.preventDefault() : onClose}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
