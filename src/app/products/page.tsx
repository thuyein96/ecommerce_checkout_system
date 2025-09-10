import React from "react";
import ProductCard from "../../components/ProductCard";

import products from "../../data/products.json";

const ProductsPage = () => {
  return (
    <main style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "24px" }}>Products</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "flex-start",
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </main>
  );
};

export default ProductsPage;
