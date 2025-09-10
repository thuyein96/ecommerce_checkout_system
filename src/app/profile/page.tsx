// app/profile/page.tsx (Server Component)
import ProfileCard from "@/components/Profile/ProfileCard";
import type { Customer } from "@/models/customer";
import type { PromotionCode } from "@/models/promotionCode";

import customersData from "@/data/customers.json";
import promotionsData from "@/data/promotion_codes.json";

export default function ProfilePage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const customers = customersData as Customer[];
  const promotions = promotionsData as PromotionCode[];

  const id = searchParams?.id;
  const customer =
    (id ? customers.find((c) => c.Cus_id === id) : undefined) ?? customers[0];

  return <ProfileCard key={customer.Cus_id} customer={customer} promotions={promotions} />;
}
