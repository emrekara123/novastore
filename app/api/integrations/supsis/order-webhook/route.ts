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
  let rawBody: any = null;
  
  try {
    // 1. Güvenli Body Okuma
    try {
      rawBody = await req.json();
    } catch (parseError) {
      // Eğer doğrudan JSON değilse, text olarak alıp parse etmeyi deneriz
      const textBody = await req.text();
      try {
        rawBody = JSON.parse(textBody);
      } catch (e) {
        console.warn('Supsis webhook gövdesi JSON olarak okunamadı. Gelen ham metin:', textBody);
        return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400, headers: corsHeaders });
      }
    }

    let { customerName, phone, address, items, paymentMethod } = rawBody || {};

    // 2. Parametre Normalizasyonu
    customerName = customerName ? String(customerName).trim() : 'Sipariş Müşterisi';
    phone = phone ? String(phone).trim() : '';
    address = address ? String(address).trim() : 'Adres belirtilmemiş';
    paymentMethod = paymentMethod ? String(paymentMethod).trim() : 'KAPIDA_ODEME';

    // 3. Items Normalizasyonu
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.warn('Supsis webhook items parse hatası:', e);
      }
    }

    if (!phone || !items || !Array.isArray(items) || items.length === 0) {
      console.warn('Eksik parametreler:', { customerName, phone, itemsType: typeof items, rawBody });
      return NextResponse.json({ success: false, error: 'Eksik veya hatalı parametreler gönderildi (phone ve items zorunludur).' }, { status: 400, headers: corsHeaders });
    }

    // 4. Kullanıcı Eşleştirme veya Oluşturma
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      const guestEmail = `guest_${Date.now()}@novastore.local`;
      user = await prisma.user.create({
        data: {
          name: customerName,
          phone,
          email: guestEmail,
          password: 'supsis_generated_guest',
          address
        }
      });
    }

    // 5. Ürünleri İşleme ve Toplam Hesaplama
    const orderItemsToCreate: Array<{ productId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;

    for (const item of items) {
      // productCode normalizasyonu ( ["PRD-xxx"] -> PRD-xxx )
      let rawCode = item.productCode || item.code;
      
      if (typeof rawCode === 'string' && rawCode.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawCode);
          if (Array.isArray(parsed)) rawCode = parsed[0];
        } catch (e) {}
      }
      
      if (Array.isArray(rawCode)) {
        rawCode = rawCode[0];
      }
      
      const cleanCode = String(rawCode || '').replace(/[\[\]"']/g, '').trim().toUpperCase();
      const quantity = Number(item.quantity) || 1;

      if (!cleanCode) continue;

      const product = await prisma.product.findUnique({ where: { code: cleanCode } });
      
      if (!product) {
        return NextResponse.json({ success: false, error: `${cleanCode} kodlu ürün bulunamadı.` }, { status: 404, headers: corsHeaders });
      }

      if (product.stock < quantity) {
        return NextResponse.json({ success: false, error: `${product.name} için yeterli stok yok. Kalan stok: ${product.stock}` }, { status: 400, headers: corsHeaders });
      }

      orderItemsToCreate.push({
        productId: product.id,
        quantity: quantity,
        price: product.price
      });

      totalAmount += (product.price * quantity);
    }

    if (orderItemsToCreate.length === 0) {
      return NextResponse.json({ success: false, error: 'Siparişe eklenecek geçerli ürün bulunamadı.' }, { status: 400, headers: corsHeaders });
    }

    const orderNumber = `ORD-SUP-${Date.now().toString().slice(-6)}`;

    // 6. Sipariş ve Stok Güncelleme (Transaction)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          totalAmount,
          status: 'YENI',
          paymentMethod,
          address: address !== 'Adres belirtilmemiş' ? address : (user.address || 'Adres belirtilmemiş'),
          phone,
          customerName,
          orderItems: {
            create: orderItemsToCreate
          }
        }
      });

      // Stokları düş
      for (const item of orderItemsToCreate) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    console.log(`🤖 SUPSIS WEBHOOK İLE SİPARİŞ ALINDI: ${orderNumber}`);

    // 7. Başarılı Yanıt (200 OK)
    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderNumber: order.orderNumber
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Supsis Order Webhook Error:', error);
    console.error('📦 Gelen Ham Payload:', rawBody);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Bilinmeyen bir hata oluştu.' 
    }, { status: 500, headers: corsHeaders });
  }
}
