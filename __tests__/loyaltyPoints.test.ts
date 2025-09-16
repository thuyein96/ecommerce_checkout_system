
import type { PromotionCode } from "@/models/promotionCode";
import {
    normalizePointsToRedeem,
    pointsEarnedFrom,
    pointsToBaht
} from "@/utils/loyalty";

const promo = (over: Partial<PromotionCode> = {}): PromotionCode =>
({
    PromotionCode_id: "P1",
    Name: "TEST",
    Promotion_code_type: "fixed",
    Start_date: "2025-09-01",
    End_date: "2025-09-30",
    Period: 30,
    ...over,
} as any);

describe("pointsToBaht", () => {
    test("10 pts = 1 baht, floors correctly", () => {
        expect(pointsToBaht(0)).toBe(0);
        expect(pointsToBaht(5)).toBe(0);
        expect(pointsToBaht(9)).toBe(0);
        expect(pointsToBaht(10)).toBe(1);
        expect(pointsToBaht(19)).toBe(1);
        expect(pointsToBaht(20)).toBe(2);
        expect(pointsToBaht(123)).toBe(12);
    });
});

describe("pointsEarnedFrom", () => {
    test("earns 1 point per ฿100 (floor)", () => {
        expect(pointsEarnedFrom(0)).toBe(0);
        expect(pointsEarnedFrom(99)).toBe(0);
        expect(pointsEarnedFrom(100)).toBe(1);
        expect(pointsEarnedFrom(199)).toBe(1);
        expect(pointsEarnedFrom(200)).toBe(2);
        expect(pointsEarnedFrom(999)).toBe(9);
    });
});

describe("normalizePointsToRedeem", () => {
    test("clamps by balance and payable, snaps to multiples of 10", () => {
        // balance 250 pts; payable ฿37 (max 370 pts by amount)
        expect(normalizePointsToRedeem(135, 250, 37)).toBe(130); // snap down to 130
        expect(normalizePointsToRedeem(400, 250, 37)).toBe(250); // balance cap
        expect(normalizePointsToRedeem(999, 1000, 37)).toBe(370); // payable cap
        expect(normalizePointsToRedeem(-50, 200, 100)).toBe(0);   // negative -> 0
        expect(normalizePointsToRedeem(0, 200, 100)).toBe(0);
        expect(normalizePointsToRedeem(50, 40, 999)).toBe(40);    // balance smaller, snap ok
        expect(normalizePointsToRedeem(44, 1000, 3)).toBe(30);    // payable 3 baht -> 30 pts
    });

    test("payable zero means no redemption", () => {
        expect(normalizePointsToRedeem(500, 1000, 0)).toBe(0);
    });
});
