import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    // Read the current products.json file
    const productsPath = path.join(process.cwd(), "src/data/products.json");
    const productsData = await fs.readFile(productsPath, "utf8");
    const products = JSON.parse(productsData);

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error reading products data:", error);
    return NextResponse.json(
      { error: "Failed to read products data" },
      { status: 500 }
    );
  }
}
