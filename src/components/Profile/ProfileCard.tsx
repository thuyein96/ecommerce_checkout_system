"use client";

import type { Customer } from "@/models/customer";
import type { PromotionCode } from "@/models/promotionCode";
import { useEffect, useMemo, useState } from "react";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import type { ChipProps } from "@mui/material/Chip";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type ChipColor = ChipProps["color"];

function initials(name: string) {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("");
}
const nf = new Intl.NumberFormat("en-US");

function promoColor(t: PromotionCode["Promotion_code_type"]): ChipColor {
    switch (t) {
        case "percentage": return "primary";
        case "fixed": return "secondary";
        case "free_delivery": return "success";
        default: return "default";
    }
}

function getPromoStatus(p: PromotionCode) {
    const today = new Date(); // adjust if you want specific TZ display
    const start = new Date(p.Start_date);
    const end = new Date(p.End_date);
    if (today < start) return { label: "Upcoming", color: "info" as ChipColor };
    if (today > end) return { label: "Expired", color: "default" as ChipColor };
    return { label: "Active", color: "success" as ChipColor };
}

export default function ProfileCard({
    customer,
    promotions,
}: {
    customer: Customer;
    promotions: PromotionCode[];
}) {
    const promoMap = useMemo(
        () => new Map(promotions.map(p => [p.PromotionCode_id, p])),
        [promotions]
    );
    const [liveCustomer, setLiveCustomer] = useState(customer);
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "demo_customer" && e.newValue) {
                try {
                    const parsed: Customer = JSON.parse(e.newValue);
                    if (parsed?.Cus_id === customer.Cus_id) setLiveCustomer(parsed);
                } catch { }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [customer.Cus_id]);


    // then render with liveCustomer instead of customer:
    const customerPromos = liveCustomer.Promotion_codes
        .map(code => promoMap.get(code))
        .filter((p): p is PromotionCode => Boolean(p));

    const promoTypes = Array.from(new Set(customerPromos.map(p => p.Promotion_code_type)));

    return (
        <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardHeader
                avatar={<Avatar sx={{ width: 56, height: 56 }}>{initials(liveCustomer.Cus_name)}</Avatar>}
                title={<Typography variant="h6">{liveCustomer.Cus_name}</Typography>}
                subheader={`ID: ${liveCustomer.Cus_id}`}
            />
            <Divider />
            <CardContent>
                {/* Info grid */}
                <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}>
                    <Stack spacing={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                        <Typography variant="body2">{liveCustomer.Address}</Typography>
                    </Stack>

                    <Stack spacing={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">Loyalty</Typography>
                        <Typography variant="h5">{nf.format(liveCustomer.Loyal_points)} pts</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {promoTypes.length ? (
                                promoTypes.map(t => (
                                    <Chip key={t} size="small" color={promoColor(t)} label={t.replace("_", " ")} />
                                ))
                            ) : (
                                <Chip size="small" label="No promotions" />
                            )}
                        </Stack>
                    </Stack>

                    <Stack spacing={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                        <Typography variant="body2">
                            <a href={`tel:${liveCustomer.Phone}`} style={{ textDecoration: "none", color: "inherit" }}>
                                {liveCustomer.Phone}
                            </a>
                        </Typography>
                    </Stack>

                    <Stack spacing={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body2">
                            <a href={`mailto:${liveCustomer.Email}`} style={{ textDecoration: "none", color: "inherit" }}>
                                {liveCustomer.Email}
                            </a>
                        </Typography>
                    </Stack>
                </Box>

                {/* Promotion cards */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Promotions
                </Typography>

                <Stack spacing={1.5}>
                    {customerPromos.length ? (
                        customerPromos.map(p => {
                            const status = getPromoStatus(p);
                            return (
                                <Card key={p.PromotionCode_id} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                                            <Stack>
                                                <Typography variant="subtitle1">{p.Name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Valid: {p.Start_date} – {p.End_date} ({p.Period} days)
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Chip size="small" color={promoColor(p.Promotion_code_type)} label={p.Promotion_code_type.replace("_", " ")} />
                                                <Chip size="small" color={status.color} label={status.label} />
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No promotions assigned.
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
