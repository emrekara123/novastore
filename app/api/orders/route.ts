import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-nova-key-2026';

// Helper to get current user from token
async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Siparişler getirilirken hata oluştu.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sipariş oluşturmak için giriş yapmalısınız.' }, { status: 401 });
    }

    const { items, customerName, phone, address, paymentMethod, totalAmount } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sepetiniz boş.' }, { status: 400 });
    }

    if (!customerName || !phone || !address || !paymentMethod) {
      return NextResponse.json({ error: 'Lütfen tüm teslimat bilgilerini doldurun.' }, { status: 400 });
    }

    const orderNumber = `ORD-2026-${Date.now().toString().slice(-6)}`;

    // Use Prisma Transaction to create order and decrement stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          totalAmount,
          status: 'YENI',
          paymentMethod,
          address,
          phone,
          customerName,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
            }))
          }
        },
        include: {
          orderItems: true
        }
      });

      // 2. Decrement stock for each item
      for (const item of items) {
        // Find current stock to ensure we don't go negative (optional check, but good practice)
        const product = await tx.product.findUnique({ where: { id: item.product.id } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`${item.product.name} için yeterli stok bulunmuyor.`);
        }

        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      return order;
    });

    return NextResponse.json({ message: 'Sipariş başarıyla oluşturuldu.', order: result }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Sipariş oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
