import React from "react";
import ProductCard from "../../components/ProductCard";

import products from "../../data/products.json";
import Link from "next/link";

const ProductsPage = () => {
  return (
    <main style={{ padding: "32px" }}>
      <div className="flex items-center mb-8 gap-4">
        <h1 style={{ fontSize: "2rem" }}>Products</h1>
        <Link
          href="/cart"
          className="p-2 bg-red-500 rounded-lg cursor-pointer font-semibold text-white"
        >
          View your shopping cart
        </Link>
      </div>
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
