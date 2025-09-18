"use client";
import React, { useState } from "react";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
  product: {
    product_id: string;
    product_name: string;
    price: number;
    shop_id: string;
    image: string;
    review: number;
    instock_Quantity: number;
    product_category: string;
  };
}

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const imageSrc =
    product.image && product.image.trim() !== "" ? product.image : DUMMY_IMAGE;

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };
  const handleIncrease = () => {
    setQuantity((prev) => (prev < product.instock_Quantity ? prev + 1 : prev));
  };
  const { addToCart } = useCart();
  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`Added ${quantity} x ${product.product_name} to cart!`);
  };

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: "8px",
        padding: "16px",
        width: "260px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#fff",
        margin: "8px",
      }}
    >
      <img
        src={imageSrc}
        alt={product.product_name}
        style={{
          width: "180px",
          height: "180px",
          objectFit: "cover",
          borderRadius: "6px",
          background: "#f3f3f3",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = DUMMY_IMAGE;
        }}
      />
      <h3 style={{ margin: "12px 0 4px 0", fontSize: "1.1rem" }}>
        {product.product_name}
      </h3>
      <p style={{ color: "#888", margin: "0 0 8px 0" }}>
        {product.product_category}
      </p>
      <p
        style={{ fontWeight: "bold", fontSize: "1.1rem", margin: "0 0 8px 0" }}
      >
        {product.price.toFixed(2)} Baht
      </p>
      <p style={{ color: "#f5a623", margin: "0 0 8px 0" }}>
        ⭐ {product.review} / 5
      </p>
      <p
        style={{
          color: product.instock_Quantity > 0 ? "#27ae60" : "#c0392b",
          margin: "0 0 8px 0",
        }}
      >
        {product.instock_Quantity > 0
          ? `In Stock: ${product.instock_Quantity}`
          : "Out of Stock"}
      </p>
      <div
        style={{
          marginTop: "8px",
          padding: "4px 10px",
          background: "#eaf6ff",
          borderRadius: "4px",
          fontWeight: "bold",
          color: "#0070f3",
          fontSize: "0.95rem",
        }}
      >
        From Shop: {product.shop_id}
      </div>
      {/* Quantity Selector & Add to Cart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: "16px",
          gap: "8px",
        }}
      >
        <button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          style={{
            padding: "4px 10px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "#f7f7f7",
            cursor: quantity > 1 ? "pointer" : "not-allowed",
          }}
        >
          -
        </button>
        <span
          style={{ minWidth: "32px", textAlign: "center", fontWeight: "bold" }}
        >
          {quantity}
        </span>
        <button
          onClick={handleIncrease}
          disabled={quantity >= product.instock_Quantity}
          style={{
            padding: "4px 10px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "#f7f7f7",
            cursor:
              quantity < product.instock_Quantity ? "pointer" : "not-allowed",
          }}
        >
          +
        </button>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={product.instock_Quantity === 0}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          background: product.instock_Quantity === 0 ? "#ccc" : "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          fontSize: "1rem",
          cursor: product.instock_Quantity === 0 ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
