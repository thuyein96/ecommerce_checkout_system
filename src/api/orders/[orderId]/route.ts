// pages/api/orders/[customerId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { Order } from '@/models';

const orders = JSON.parse(await fs.readFile('./data/orders.json', 'utf-8')) as Order[];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;
  if(!orderId) return res.status(400).json({ error: 'missing orderId' });
  const order = orders.find((order: Order) => order.id === orderId);
  res.status(200).json(order);
}
