import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { action, productId, quantity } = await req.json();
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session_id')?.value;
    let cart = null;

    if (sessionId) {
      cart = await prisma.cart.findUnique({ where: { sessionId } });
    }

    if (!cart) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        cart = await prisma.cart.findFirst({
          where: { userId: firstUser.id },
          orderBy: { updatedAt: 'desc' }
        });
      }
    }

    if (!cart) return NextResponse.json({ success: true });

    if (action === 'clear') {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } 
    else if (action === 'remove' && productId) {
      const item = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
      if (item) {
        await prisma.cartItem.delete({ where: { id: item.id } });
      }
    } 
    else if (action === 'update' && productId && quantity !== undefined) {
      const item = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
      if (item) {
        if (quantity <= 0) {
          await prisma.cartItem.delete({ where: { id: item.id } });
        } else {
          await prisma.cartItem.update({
            where: { id: item.id },
            data: { quantity }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart Action Error:', error);
    return NextResponse.json({ error: 'Sistem hatası' }, { status: 500 });
  }
}
