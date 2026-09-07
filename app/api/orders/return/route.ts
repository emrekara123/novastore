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

    console.log("\n📦 👉 SUPSIS RETURN REQUEST GELDİ:", body);

    let { orderId, phone, reason, imageUrl } = body;

    // Eğer parametreler eksikse hata dön
    if (!orderId || !phone || !reason) {
      console.log("❌ Eksik parametre.");
      return NextResponse.json({ success: false, message: 'Lütfen sipariş ID/No, telefon ve iade nedeni bilgilerini eksiksiz girin.' }, { status: 200, headers: corsHeaders });
    }

    console.log("🔎 Aranacak Sipariş Parametreleri:", { orderId, phone, reason });

    // 1. Siparişi Veritabanında Bul (id veya orderNumber)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: String(orderId).trim() },
          { id: String(orderId).trim() }
        ]
      }
    });

    if (!order) {
      console.log(`❌ Sipariş Bulunamadı! (Aranan orderId: ${orderId})`);
      // Supsis bot akışı patlamasın diye hata mesajını 200 ile dönüyoruz.
      return NextResponse.json({ success: false, message: `Sipariş sistemde bulunamadı: ${orderId}` }, { status: 200, headers: corsHeaders });
    }

    // 2. Esnek Telefon Kontrolü (Sadece son 10 haneyi kontrol et)
    const normalizePhone = (p: string) => {
      const cleaned = String(p).replace(/\D/g, ''); // Sadece rakamları bırak (boşluk, +90, vs. gider)
      return cleaned.slice(-10); // Sadece son 10 hanesini al (örn: 5426104349)
    };

    const incomingPhone = normalizePhone(phone);
    const dbPhone = normalizePhone(order.phone);

    console.log("☎️ Telefon Karşılaştırma:", { incoming: incomingPhone, db: dbPhone });

    if (incomingPhone !== dbPhone) {
      console.log(`❌ Telefon Eşleşmedi! Gelen: ${incomingPhone}, DB: ${dbPhone}`);
      return NextResponse.json({ success: false, message: 'Girdiğiniz telefon numarası siparişin sahibiyle eşleşmiyor.' }, { status: 200, headers: corsHeaders });
    }

    // 3. Mükerrer İade Kontrolü
    if (order.returnStatus !== 'NONE') {
      console.log(`⚠️ Bu sipariş için zaten iade kaydı var (Durum: ${order.returnStatus}).`);
      return NextResponse.json({ success: false, message: 'Bu siparişiniz için halihazırda alınmış bir iade talebi bulunmaktadır.' }, { status: 200, headers: corsHeaders });
    }

    // 4. Veritabanını Güncelle
    await prisma.order.update({
      where: { id: order.id },
      data: {
        returnStatus: 'REQUESTED', // Frontend kodumuz bu durumu okuyor ("İade Talebi İnceleniyor" badge'i için)
        returnReason: reason,
        returnImageUrl: imageUrl || null // Şemaya eklediğimiz yeni opsiyonel alan
      }
    });

    console.log("✅ İade Talebi Başarıyla Oluşturuldu:", order.orderNumber);

    return NextResponse.json({ 
      success: true, 
      message: "İade talebiniz başarıyla alındı. 2 iş günü içinde incelenecektir.", 
      returnCode: "RET-" + order.orderNumber.replace('ORD-', '').replace('SUP-', '')
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Return Request Fatal Error:', error);
    return NextResponse.json({ success: false, message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' }, { status: 200, headers: corsHeaders });
  }
}
