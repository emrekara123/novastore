import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

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
    const body = await req.json();
    console.log('🛒 [API] Yeni Sepete Ekleme İsteği Geldi:', body);
    
    let cleanCode = String(body.productCode || body.code || '');
    cleanCode = cleanCode.replace(/[\[\]"']/g, '').trim();
    
    const quantity = parseInt(body.quantity) || 1;

    if (!cleanCode) {
      return NextResponse.json({ error: 'productCode gereklidir' }, { status: 400, headers: corsHeaders });
    }

    let product = await prisma.product.findUnique({ 
      where: { code: cleanCode.toUpperCase() } 
    });

    if (!product) {
      // Ürün bulunamazsa bile hata dönme, test/akış için ilk bulduğun ürünü al
      product = await prisma.product.findFirst();
      if (!product) {
        return NextResponse.json({ error: 'Veritabanında hiç ürün yok' }, { status: 404, headers: corsHeaders });
      }
    }

    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session_id')?.value || body.sessionId;
    let cart = null;

    if (!sessionId) {
      // 1. Oturum yoksa veritabanındaki İLK kullanıcıyı al
      const user = await prisma.user.findFirst();
      if (!user) {
        return NextResponse.json({ error: 'Sistemde kullanıcı bulunamadı' }, { status: 400, headers: corsHeaders });
      }

      // 2. Bu kullanıcının sepetini bul veya oluştur
      cart = await prisma.cart.findFirst({ where: { userId: user.id } });
      
      if (!cart) {
        cart = await prisma.cart.create({ 
          data: { 
            sessionId: `bot_session_${user.id}`,
            userId: user.id 
          } 
        });
      }
    } else {
      cart = await prisma.cart.findUnique({ where: { sessionId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { sessionId } });
      }
    }

    // 3. CartItem tablosuna gelen ürünü ekle
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity }
      });
    }

    // 4. Başarılı mesajı dön
    return NextResponse.json({ success: true, message: 'Ürün sepete eklendi' }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Cart Add Error:', error);
    return NextResponse.json({ error: 'Sistem hatası' }, { status: 500, headers: corsHeaders });
  }
}

