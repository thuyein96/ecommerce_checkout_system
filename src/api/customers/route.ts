import type { Customer } from "@/models/customer";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "src", "app", "data", "customers.json");
    const raw = await fs.readFile(file, "utf-8");
    const arr = JSON.parse(raw) as Customer[];
    return NextResponse.json(arr);
  } catch (err) {
    console.error("read customers error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
