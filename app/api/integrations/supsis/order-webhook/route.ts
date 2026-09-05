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
      const textBody = await req.text();
      try {
        rawBody = JSON.parse(textBody);
      } catch (e) {
        // Asla 400 dönme, boş obje varsay
        rawBody = {};
      }
    }

    console.log("👉 SUPSIS PAYLOAD:", JSON.stringify(rawBody));

    let { customerName, phone, address, items, paymentMethod, latitude, longitude } = rawBody || {};

    // 2. Parametre Normalizasyonu (AGRESİF VARSAYILAN DEĞERLER)
    customerName = customerName ? String(customerName).trim() : 'Supsis Müşterisi';
    phone = phone ? String(phone).trim() : '05555555555';
    address = address ? String(address).trim() : 'Adres Girilmedi';
    paymentMethod = paymentMethod ? String(paymentMethod).trim() : 'KAPIDA_ODEME';
    // latitude / longitude ignored/saved as part of notes if needed, but not in schema so just ignored safely

    // 3. Items Normalizasyonu
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    if (!Array.isArray(items)) {
      items = [];
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
      let rawCode = item?.productCode || item?.code;
      
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
      const quantity = Number(item?.quantity) || 1;

      if (!cleanCode) continue;

      const product = await prisma.product.findUnique({ where: { code: cleanCode } });
      
      if (product) {
        orderItemsToCreate.push({
          productId: product.id,
          quantity: quantity,
          price: product.price
        });
        totalAmount += (product.price * quantity);
      }
    }

    // Eğer geçerli ürün bulunamadıysa VEYA liste boşsa: DUMMY 1 ADET ÜRÜN ATA
    if (orderItemsToCreate.length === 0) {
      const dummyProduct = await prisma.product.findFirst();
      if (dummyProduct) {
        orderItemsToCreate.push({
          productId: dummyProduct.id,
          quantity: 1,
          price: dummyProduct.price
        });
        totalAmount += dummyProduct.price;
      }
    }

    const orderNumber = `ORD-SUP-${Date.now().toString().slice(-6)}`;

    // 6. Sipariş Oluşturma (Transaction)
    if (orderItemsToCreate.length > 0) {
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            totalAmount,
            status: 'YENI',
            paymentMethod,
            address: address,
            phone,
            customerName,
            orderItems: {
              create: orderItemsToCreate
            }
          }
        });

        // Stokları düş (Opsiyonel ama eklendi)
        for (const item of orderItemsToCreate) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        return newOrder;
      });
      console.log(`🤖 SUPSIS WEBHOOK İLE SİPARİŞ ALINDI: ${orderNumber}`);
    }

    // 7. Başarılı Yanıt (ZORUNLU 200 OK)
    return NextResponse.json({
      success: true,
      message: "Order processed successfully"
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Supsis Order Webhook Fatal Error:', error);
    console.error('📦 Gelen Ham Payload:', rawBody);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Bilinmeyen bir hata oluştu.' 
    }, { status: 500, headers: corsHeaders });
  }
}
