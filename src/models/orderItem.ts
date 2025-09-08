import { DeliveryType } from "@/utils/enum/delivery_types";

export interface OrderItem {
  OrderItem_id: string;
  Order_id?: string;
  Product_id: string;
  Quantity: number;
  SubTotal: number;
  Delivery_fee_type: DeliveryType;
}
