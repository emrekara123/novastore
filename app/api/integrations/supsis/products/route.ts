import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        stock: true,
        description: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Supsis Integration - Fetch Products Error:', error);
    return NextResponse.json({ error: 'Ürün kataloğu alınamadı.' }, { status: 500 });
  }
}
