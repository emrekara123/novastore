import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET isteği için handler
export async function GET(req: Request) {
  return handleSearch(req);
}

// POST isteği de atılabilir ihtimaline karşı handler
export async function POST(req: Request) {
  return handleSearch(req);
}

async function handleSearch(req: Request) {
  try {
    let code = null;

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      code = searchParams.get('code') || searchParams.get('sku');
    } else if (req.method === 'POST') {
      const body = await req.json();
      code = body.code || body.sku;
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: "Lütfen 'code' veya 'sku' parametresini gönderin (Örn: ?code=PRD-101)." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ürünü code alanına göre ara (Büyük harfe çevirerek eşleştirme garantisi)
    const product = await prisma.product.findFirst({
      where: {
        code: code.toUpperCase()
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Ürün bulunamadı" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, product },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Supsis Product Search Error:', error);
    return NextResponse.json(
      { success: false, message: 'Ürün aranırken sistemsel bir hata oluştu.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
