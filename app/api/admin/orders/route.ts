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

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Admin Fetch Orders Error:', error);
    return NextResponse.json({ error: 'Siparişler getirilirken hata oluştu.' }, { status: 500 });
  }
}
