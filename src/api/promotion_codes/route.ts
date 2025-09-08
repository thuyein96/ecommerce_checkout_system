import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import { PromotionCode } from '@/models/promotionCode';

export async function GET() {
  try {
    const file = path.join(
      process.cwd(),
      'app',
      'src',
      'app',
      'data',
      'promotion_codes.json'
    );
    const raw = await fs.readFile(file, 'utf-8');
    const arr = JSON.parse(raw) as PromotionCode[];
    return NextResponse.json(arr);
  } catch (err) {
    console.error('read promotion_codes error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}