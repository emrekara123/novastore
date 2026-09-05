import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  let rawBody: any = null;
  try {
    rawBody = await req.json();
    let { customerName, phone, address, items, paymentMethod } = rawBody;

    // 1. Eğer items string olarak gelmişse array'e çevir
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.warn('Supsis webhook items parse hatası:', e);
      }
    }

    // Validate payload
    if (!customerName || !phone || !items || !Array.isArray(items) || items.length === 0) {
      console.warn('Eksik parametreler:', { customerName, phone, itemsType: typeof items, rawBody });
      return NextResponse.json({ error: 'Eksik veya hatalı parametreler gönderildi.' }, { status: 400 });
    }

    // ... (Kalan kısımlar aşağıda değişmeden kalacak)
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

    const orderItemsToCreate: Array<{ productId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;

    for (const item of items) {
      let rawCode = item.productCode;
      
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

      const product = await prisma.product.findUnique({ where: { code: cleanCode } });
      
      if (!product) {
        return NextResponse.json({ error: `${cleanCode} kodlu ürün bulunamadı.` }, { status: 404 });
      }

      if (product.stock < quantity) {
        return NextResponse.json({ error: `${product.name} için yeterli stok yok. Kalan stok: ${product.stock}` }, { status: 400 });
      }

      orderItemsToCreate.push({
        productId: product.id,
        quantity: quantity,
        price: product.price
      });

      totalAmount += (product.price * quantity);
    }

    const orderNumber = `ORD-SUP-${Date.now().toString().slice(-6)}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          totalAmount,
          status: 'YENI',
          paymentMethod: paymentMethod || 'KAPIDA_ODEME',
          address: address || user.address || 'Adres belirtilmemiş',
          phone,
          customerName,
          orderItems: {
            create: orderItemsToCreate
          }
        },
        include: {
          orderItems: true
        }
      });

      for (const item of orderItemsToCreate) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    console.log(`🤖 SUPSIS WEBHOOK İLE SİPARİŞ ALINDI: ${orderNumber}`);

    return NextResponse.json({
      status: 'success',
      message: 'Sipariş başarıyla oluşturuldu.',
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Supsis Order Webhook Error:', error);
    console.error('📦 Gelen Ham Payload:', rawBody);
    return NextResponse.json({ error: 'Sipariş işlenirken bir hata oluştu.', details: error.message }, { status: 500 });
  }
}
