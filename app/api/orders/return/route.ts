import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { orderId, phone, reason } = await req.json();

    if (!orderId || !phone || !reason) {
      return NextResponse.json({ success: false, message: 'Lütfen sipariş ID, telefon ve iade nedeni bilgilerini eksiksiz girin.' }, { status: 400 });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    // Müşteri güvenliği: Siparişteki telefonla doğrulama yap (boşlukları temizleyerek)
    if (order.phone.replace(/\s+/g, '') !== phone.replace(/\s+/g, '')) {
      return NextResponse.json({ success: false, message: 'Girilen telefon numarası siparişteki telefon numarasıyla eşleşmiyor.' }, { status: 403 });
    }

    if (order.returnStatus !== 'NONE') {
      return NextResponse.json({ success: false, message: 'Bu sipariş için zaten bir iade talebi bulunuyor.' }, { status: 400 });
    }

    // Update the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        returnStatus: 'REQUESTED',
        returnReason: reason
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "İade talebiniz başarıyla alındı. 2 iş günü içinde incelenecektir.", 
      returnCode: "RET-" + orderId.slice(0, 8).toUpperCase()
    }, { status: 200 });

  } catch (error: any) {
    console.error('Return Request Error:', error);
    return NextResponse.json({ success: false, message: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
