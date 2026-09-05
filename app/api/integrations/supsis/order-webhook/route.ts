import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, address, items, paymentMethod } = body;

    // Validate payload
    if (!customerName || !phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Eksik veya hatalı parametreler gönderildi.' }, { status: 400 });
    }

    // Try to find if user exists by phone, if not create a temporary guest user or associate with a generic Supsis Bot User
    // To keep it simple, we'll try to find by phone, otherwise we'll create a guest user (since User requires password, we generate a random one for guest)
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      // Create guest user
      const guestEmail = `guest_${Date.now()}@novastore.local`;
      user = await prisma.user.create({
        data: {
          name: customerName,
          phone,
          email: guestEmail,
          password: 'supsis_generated_guest', // Note: In real world use bcrypt or a guest flag
          address
        }
      });
    }

    // Process items and calculate total, check stocks
    const orderItemsToCreate: Array<{ productId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { code: item.productCode } });
      
      if (!product) {
        return NextResponse.json({ error: `${item.productCode} kodlu ürün bulunamadı.` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `${product.name} için yeterli stok yok. Kalan stok: ${product.stock}` }, { status: 400 });
      }

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += (product.price * item.quantity);
    }

    const orderNumber = `ORD-SUP-${Date.now().toString().slice(-6)}`;

    // Create Order with Transaction
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

      // Decrement stocks
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
    console.error('Supsis Order Webhook Error:', error);
    return NextResponse.json({ error: 'Sipariş işlenirken bir hata oluştu.', details: error.message }, { status: 500 });
  }
}
