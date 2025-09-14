import { Promotion_code_type } from "@/utils/enum/promotion_code_type";

export interface PromotionCode {
  PromotionCode_id: string;
  Name: string; // e.g. "SAVE20", "WELCOME25", "FREESHIP"
  Promotion_code_type: Promotion_code_type;
  Min_spend?: number; // optional minimum spend requirement
  Max_discount?: number; // optional maximum discount cap for percentage codes
  Global_limit?: number; // optional global usage limit
  Eligible_products?: string[]; // optional list of eligible product IDs
  Eligible_categories?: string[]; // optional list of eligible category IDs
  Start_date: string; // ISO
  End_date: string;   // ISO
  Period: number;
}
