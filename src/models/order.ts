export interface Order {
  Order_id: string;
  Cus_id: string;
  total_price: number; // historical, not used for live calculation
  coupon: string | null;
  total_delivery_fees: number; // historical, not used for live calculation
  loyalty_points: number;
}
