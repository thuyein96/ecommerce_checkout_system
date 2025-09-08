export interface Customer {
  Cus_id: string;
  Cus_name: string;
  Address: string;
  Loyal_points: number;
  Promotion_code_type: "percentage" | "fixed" | "free_delivery";
}
