"use client";
import React, { createContext, useContext, useState } from "react";
import { CartItem } from "./CartContext";
import { Customer, PromotionCode } from "@/models";
import { DeliveryType } from "@/utils/enum/delivery_types";

export interface OrderData {
    orderId: string;
    customer: Customer;
    shopGroups: Record<string, CartItem[]>;
    deliveryMethods: Record<string, DeliveryType>;
    appliedCoupon: PromotionCode | null;
    subtotal: number;
    totalDeliveryFees: number;
    effectiveDelivery: number;
    discountAmount: number;
    pointsUsed: number;
    pointsDiscountBaht: number;
    finalTotal: number;
    pointsEarned: number;
    orderDate: string;
}

interface OrderContextType {
    currentOrder: OrderData | null;
    setCurrentOrder: (order: OrderData) => void;
    clearCurrentOrder: () => void;
}

const OrderContext = createContext<OrderContextType>({
    currentOrder: null,
    setCurrentOrder: () => { },
    clearCurrentOrder: () => { },
});

export const useOrder = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [currentOrder, setCurrentOrderState] = useState<OrderData | null>(null);

    const setCurrentOrder = (order: OrderData) => {
        setCurrentOrderState(order);
    };

    const clearCurrentOrder = () => {
        setCurrentOrderState(null);
    };

    return (
        <OrderContext.Provider value={{ currentOrder, setCurrentOrder, clearCurrentOrder }}>
            {children}
        </OrderContext.Provider>
    );
};