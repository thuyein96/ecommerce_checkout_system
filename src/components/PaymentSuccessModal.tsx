import Link from "next/link";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: string;
  orderId: string;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  orderTotal,
  orderId,
}) => {
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
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
          </div>
          
          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your payment of <span className="font-semibold text-green-600">{orderTotal}</span> has been processed successfully.
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
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors block text-center shadow-lg"
              onClick={onClose}
            >
              🏠 Back to Home
            </Link>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
