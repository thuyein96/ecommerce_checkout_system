// pages/api/order_items/[orderId].ts
import { Product } from '@/models';
import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';

const products = JSON.parse(await fs.readFile('./data/products.json', 'utf-8')) as Product[];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;
  const product = products.find((item) => item.id === productId);

  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ message: `Product with ID ${productId} not found` });
  }
}
