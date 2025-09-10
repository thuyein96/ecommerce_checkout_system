import React from "react";
interface ProductCardProps {
  productList: product[];
}
interface product {
  product_id: string;
  product_name: string;
  price: number;
  shop_id: string;
  image: string;
  review: number;
  instock_Quantity: number;
  product_category: string;
}
type Props = {};

const page = (props: Props) => {
  return <div>page</div>;
};

export default page;
