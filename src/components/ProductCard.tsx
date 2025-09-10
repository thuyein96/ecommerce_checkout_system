import React from "react";

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

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
        src={product.image}
        alt={product.product_name}
        style={{
          width: "180px",
          height: "180px",
          objectFit: "cover",
          borderRadius: "6px",
          background: "#f3f3f3",
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
        ${product.price.toFixed(2)}
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
    </div>
  );
};

export default ProductCard;
