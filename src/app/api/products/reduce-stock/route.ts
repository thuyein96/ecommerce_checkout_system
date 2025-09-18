import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { CartItem } from "@/context/CartContext";

interface StockUpdateRequest {
  cartItems: CartItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { cartItems }: StockUpdateRequest = await request.json();

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: "Invalid cart items provided" },
        { status: 400 }
      );
    }

    // Read the current products.json file
    const productsPath = path.join(process.cwd(), "src/data/products.json");
    const productsData = await fs.readFile(productsPath, "utf8");
    const products = JSON.parse(productsData);

    // Track updates for logging
    const productUpdates: Array<{
      productId: string;
      productName: string;
      previousStock: number;
      newStock: number;
      quantitySold: number;
    }> = [];

    // Update stock for each cart item
    for (const item of cartItems) {
      const product = products.find(
        (p: { product_id: string; instock_Quantity: number }) =>
          p.product_id === item.product.product_id
      );

      if (product) {
        const previousStock = product.instock_Quantity;
        const newStock = Math.max(0, product.instock_Quantity - item.quantity);

        // Check if sufficient stock is available
        if (item.quantity > product.instock_Quantity) {
          console.warn(
            `Insufficient stock for product ${item.product.product_id}. Available: ${product.instock_Quantity}, Requested: ${item.quantity}`
          );
          // In production, you might want to return an error or adjust quantities
        }

        product.instock_Quantity = newStock;

        productUpdates.push({
          productId: item.product.product_id,
          productName: item.product.product_name,
          previousStock,
          newStock,
          quantitySold: item.quantity,
        });

        console.log(
          `Stock updated for ${item.product.product_name}: ${previousStock} → ${newStock} (sold: ${item.quantity})`
        );
      } else {
        console.error(`Product not found: ${item.product.product_id}`);
        return NextResponse.json(
          { error: `Product not found: ${item.product.product_id}` },
          { status: 404 }
        );
      }
    }

    // Write the updated products back to the JSON file
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2), "utf8");

    console.log("Products JSON file updated successfully:", productUpdates);

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
      updates: productUpdates,
    });
  } catch (error) {
    console.error("Error updating product stock:", error);
    return NextResponse.json(
      { error: "Failed to update product stock" },
      { status: 500 }
    );
  }
}
