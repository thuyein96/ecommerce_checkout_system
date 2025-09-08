'use client';

import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, Button } from '@mui/material';
import { Order, OrderItem, Product, PromotionCode } from '@/models';
import { DeliveryType } from '@/utils/enum/delivery_types';

interface CheckoutFormProps {
  promotionCodes: PromotionCode[];
  order: Order | null;
  onApply?: (code: PromotionCode | null) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ promotionCodes, order, onApply }) => {
    const [orderItems, setOrdersItems] = useState<OrderItem[]>([]);
    const [selectedPromoId, setSelectedPromoId] = useState<string>('');
    const [appliedPromo, setAppliedPromo] = useState<PromotionCode | null>(null);
    const promos = Array.isArray(promotionCodes) ? promotionCodes : [];

    useEffect(() => {
      if (!order) return;
      if (!order.id) return;
      fetch(`/api/orders/${order.id}/order_items`)
        .then((r) => r.json())
        .then((data: OrderItem[]) => setOrdersItems(data))
        .catch(() => setOrdersItems([]));
    }, [order]);

    console.log("Order Items:", orderItems);
    const handleApply = () => {
      const promo =
        promotionCodes.find((p) => p.id === selectedPromoId) ?? null;
      setAppliedPromo(promo);
      onApply?.(promo);
    };

    const handleRemove = () => {
      setSelectedPromoId("");
      setAppliedPromo(null);
      onApply?.(null);
    };

    const findProductName = (productId: string) => {
      const product = fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((data: Product) => data.name)
        .catch(() => "Unknown Product");
      return product;
    };

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Order items list with delivery fee info */}
        <Box
          sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2, borderRadius: 1 }}
        >
          <Typography variant="subtitle1">Order items</Typography>
          {orderItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No items in cart.
            </Typography>
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
            >
              {orderItems.map((it) => (
                <Box
                  key={it.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>{findProductName(it.productId)}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qty: {it.quantity} • Subtotal: ${it.subTotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      Delivery: {it.deliveryType ?? DeliveryType.STANDARD}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Delivery Charges:{" "}
                  {order?.totalDeliveryFees}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Promotions
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <select
            value={selectedPromoId}
            onChange={(e) => setSelectedPromoId(e.target.value)}
            style={{ padding: "8px", borderRadius: 4 }}
          >
            <option value="">-- Select a promotion --</option>
            {promos.map((promo) => (
              <option key={promo.id} value={promo.id}>
                {promo.name} ({promo.type})
              </option>
            ))}
          </select>

          <Button
            variant="contained"
            onClick={handleApply}
            disabled={!selectedPromoId}
          >
            Apply
          </Button>

          <Button
            variant="outlined"
            onClick={handleRemove}
            disabled={!appliedPromo}
          >
            Remove
          </Button>
        </Box>

        {appliedPromo && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              Applied: <strong>{appliedPromo.name}</strong> — type:{" "}
              {appliedPromo.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({appliedPromo.startDate} → {appliedPromo.endDate})
            </Typography>
          </Box>
        )}
      </Box>
    );
};

export default CheckoutForm;
