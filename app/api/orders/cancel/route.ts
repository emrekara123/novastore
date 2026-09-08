import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    
    // Güvenli gövde okuma
    try {
      body = await req.json();
    } catch (e) {
      const textBody = await req.text();
      try {
        body = JSON.parse(textBody);
      } catch (err) {
        body = {};
      }
    }

    console.log("\n📦 👉 SUPSIS CANCEL REQUEST GELDİ:", body);

    let { orderId, phone, reason } = body;

    if (!orderId || !phone) {
      return NextResponse.json({ success: false, message: 'Lütfen sipariş ID/No ve telefon bilgilerini eksiksiz girin.' }, { status: 200, headers: corsHeaders });
    }

    // Siparişi Veritabanında Bul (id veya orderNumber)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: String(orderId).trim() },
          { id: String(orderId).trim() }
        ]
      },
      include: {
        orderItems: true
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: `Sipariş sistemde bulunamadı: ${orderId}` }, { status: 200, headers: corsHeaders });
    }

    // Esnek Telefon Kontrolü (Sadece son 10 haneyi kontrol et)
    const normalizePhone = (p: string) => {
      const cleaned = String(p).replace(/\D/g, ''); 
      return cleaned.slice(-10); 
    };

    const incomingPhone = normalizePhone(phone);
    const dbPhone = normalizePhone(order.phone);

    if (incomingPhone !== dbPhone) {
      return NextResponse.json({ success: false, message: 'Girdiğiniz telefon numarası siparişin sahibiyle eşleşmiyor.' }, { status: 200, headers: corsHeaders });
    }

    // İptal edilip edilemeyeceğini kontrol et
    if (order.status === 'IPTAL') {
      return NextResponse.json({ success: false, message: 'Bu sipariş zaten iptal edilmiş.' }, { status: 200, headers: corsHeaders });
    }

    if (order.status === 'KARGODA' || order.status === 'TESLIM_EDILDI') {
      return NextResponse.json({ success: false, message: 'Kargoya verilen veya teslim edilen siparişler iptal edilemez. Siparişi teslim aldıktan sonra iade talebi oluşturabilirsiniz.' }, { status: 200, headers: corsHeaders });
    }

    if (order.status !== 'YENI' && order.status !== 'HAZIRLANIYOR') {
      return NextResponse.json({ success: false, message: 'Sipariş şu an iptal edilebilir durumda değil.' }, { status: 200, headers: corsHeaders });
    }

    // İptal işlemini ve stok geri yüklemeyi Transaction ile yap
    await prisma.$transaction(async (tx) => {
      // Siparişi IPTAL durumuna al
      await tx.order.update({
        where: { id: order.id },
        data: { 
          status: 'IPTAL',
          // Eğer reason (sebep) kaydedilecek bir alan yoksa, buraya özel bir not alanı olarak eklenebilir
          // ya da returnReason alanını opsiyonel olarak "İptal Nedeni" için kullanabiliriz.
          returnReason: reason ? `[İptal Nedeni] ${reason}` : order.returnReason
        }
      });

      // Stokları geri yükle
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    });

    console.log(`✅ Sipariş İptal Edildi ve Stoklar Geri Yüklendi: ${order.orderNumber}`);

    return NextResponse.json({ 
      success: true, 
      message: "Siparişiniz başarıyla iptal edildi ve tutar iade sürecine alındı."
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Cancel Request Fatal Error:', error);
    return NextResponse.json({ success: false, message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' }, { status: 200, headers: corsHeaders });
  }
}
