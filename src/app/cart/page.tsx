"use client";
import React from "react";
import { useCart } from "../../context/CartContext";
import Link from "next/link";

const CartPage = () => {
  const { cart, clearCart, updateQuantity } = useCart();

  const grandTotal = cart.reduce(
    (total, { product, quantity }) => total + product.price * quantity,
    0
  );
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
                    Price: {product.price.toFixed(2)} Baht
                  </p>
                  <div
                    style={{
                      margin: "0 0 4px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>Quantity:</span>
                    <button
                      onClick={() =>
                        updateQuantity(product.product_id, quantity - 1)
                      }
                      style={{
                        background: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontWeight: "bold",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(product.product_id, quantity + 1)
                      }
                      style={{
                        background: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      disabled={quantity >= product.instock_Quantity}
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateQuantity(product.product_id, 0)}
                      style={{
                        background: "#ff4444",
                        color: "white",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <p style={{ margin: "0 0 4px 0" }}>
                    Total: <b>{(product.price * quantity).toFixed(2)} Baht</b>
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              border: "2px solid #007bff",
              borderRadius: "8px",
              padding: "20px",
              background: "#f8f9fa",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: "0", fontSize: "1.5rem" }}>
                Grand Total:{" "}
                <span style={{ color: "#007bff" }}>
                  {grandTotal.toFixed(2)} Baht
                </span>
              </h2>
              <Link
                href="/checkout"
                className="p-3 bg-green-500 hover:bg-green-600 rounded-lg cursor-pointer font-semibold text-white transition-colors"
                style={{ textDecoration: "none" }}
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CartPage;
