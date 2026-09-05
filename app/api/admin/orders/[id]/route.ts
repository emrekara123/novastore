import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-nova-key-2026';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    if (decoded.role !== 'ADMIN') return false;
    return decoded;
  } catch (e) {
    return false;
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { status } = await req.json();
    const { id } = await params;

    if (!status) {
      return NextResponse.json({ error: 'Yeni durum belirtilmeli.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    console.log(`🔔 SİPARİŞ DURUMU DEĞİŞTİ: ${updatedOrder.orderNumber} -> ${status}`);

    return NextResponse.json({ message: 'Sipariş durumu güncellendi.', order: updatedOrder });
  } catch (error) {
    console.error('Admin Update Order Status Error:', error);
    return NextResponse.json({ error: 'Sipariş durumu güncellenirken hata oluştu.' }, { status: 500 });
  }
}
