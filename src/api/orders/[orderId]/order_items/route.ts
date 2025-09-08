// pages/api/order_items/[orderId].ts
import { OrderItem } from '@/models';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export default async function GET(_req: Request,  { params }: { params: { orderId?: string } }) {
  const orderId = params?.orderId;
  if (!orderId) return NextResponse.json({ error: 'missing orderId' }, { status: 400 });

  try {
    const file = path.join(process.cwd(), 'app', 'src', 'app', 'data', 'order_items.json');
    const raw = await fs.readFile(file, 'utf-8');
    console.log("JSON data:", raw);
    const arr = JSON.parse(raw) as OrderItem[];

    const items = arr.filter(
      (it) => (it.orderId) === orderId
    );

    if (items.length === 0) {
      return NextResponse.json({ message: `No items found for order ${orderId}` }, { status: 404 });
    }
    if (items.length > 0) {
      return NextResponse.json(items);
    } else {
      return NextResponse.json({ message: `Order with ID ${orderId} not found` }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }

  
}
