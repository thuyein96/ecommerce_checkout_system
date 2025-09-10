import type { Customer } from "@/models/customer";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const file = path.join(process.cwd(), "src", "data", "customers.json");
    const raw = await fs.readFile(file, "utf-8");
    const arr = JSON.parse(raw) as Customer[];

    const found = arr.find(c => c.Cus_id === params.id);
    if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json(found);
  } catch (err) {
    console.error("read customer error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
