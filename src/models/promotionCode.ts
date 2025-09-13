import { Promotion_code_type } from "@/utils/enum/promotion_code_type";

export interface PromotionCode {
  PromotionCode_id: string;
  Name: string; // e.g. "SAVE20", "WELCOME25", "FREESHIP"
  Promotion_code_type: Promotion_code_type;
  Min_spend?: number; // optional minimum spend requirement
  Max_discount?: number; // optional maximum discount cap for percentage codes
  Start_date: string; // ISO
  End_date: string;   // ISO
  Period: number;
}
