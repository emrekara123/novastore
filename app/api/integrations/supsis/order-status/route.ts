import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Türkçe durum karşılıkları
const statusMap: Record<string, string> = {
  'YENI': 'alındı ve onay bekliyor',
  'HAZIRLANIYOR': 'hazırlanıyor',
  'KARGODA': 'kargoya verildi',
  'TESLIM_EDILDI': 'teslim edildi',
  'IPTAL': 'iptal edildi'
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawText = body.orderNumber || body.message || body.text || '';

    if (!rawText) {
      return NextResponse.json(
        { success: false, message: 'Lütfen sorgulamak istediğiniz sipariş numarasını gönderin.' },
        { status: 400 }
      );
    }

    // Extract order number starting with ORD- using regex
    const match = rawText.match(/(ORD-[A-Za-z0-9-]+)/i);
    const orderNumber = match ? match[1].toUpperCase() : rawText.trim();

    const order = await prisma.order.findUnique({
      where: { orderNumber }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const readableStatus = statusMap[order.status] || order.status;
    const formattedAmount = order.totalAmount.toLocaleString('tr-TR');

    return NextResponse.json({
      success: true,
      message: `${order.orderNumber} numaralı siparişiniz şu an ${readableStatus}. Toplam tutar: ${formattedAmount} ₺.`,
      status: order.status,
      totalAmount: order.totalAmount,
      orderNumber: order.orderNumber
    });

  } catch (error: any) {
    console.error('Supsis Order Status Webhook Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sipariş sorgulanırken sistemsel bir hata oluştu.' },
      { status: 500 }
    );
  }
}
