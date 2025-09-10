export interface Customer {
  Cus_id: string;
  Cus_name: string;
  Address: string;
  Loyal_points: number;
  Phone: string;
  Email: string;
  Promotion_codes: string[]; // e.g. ["PROMO001", "PROMO003"]
}
