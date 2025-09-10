"use client";
import React from "react";
import { useCart } from "../../context/CartContext";
import Link from "next/link";

const CartPage = () => {
  const { cart, clearCart } = useCart();
  return (
    <main style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "24px" }}>Cart</h1>
      <Link
        href="/products"
        className="p-2 bg-blue-500 rounded-lg cursor-pointer font-semibold text-white"
      >
        Back to Products
      </Link>
      <br />
      <br />
      <button
        onClick={clearCart}
        className="p-2 bg-red-500 rounded-lg cursor-pointer font-semibold text-white"
      >
        Clear Cart
      </button>
      <br />
      <br />
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {cart.map(({ product, quantity }) => (
            <div
              key={product.product_id}
              style={{
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "16px",
                background: "#fff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <img
                  src={product.image}
                  alt={product.product_name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
                <div>
                  <h3 style={{ margin: "0 0 4px 0" }}>
                    {product.product_name}
                  </h3>
                  <p style={{ margin: "0 0 4px 0", color: "#888" }}>
                    {product.product_category}
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    From Shop: <b>{product.shop_id}</b>
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    Price: ${product.price.toFixed(2)}
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    Quantity: <b>{quantity}</b>
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    Total: <b>${(product.price * quantity).toFixed(2)}</b>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default CartPage;
