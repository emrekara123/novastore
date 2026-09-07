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
    let rawBody: any = {};
    
    // Güvenli Body Okuma (Supsis'ten stringify gelebilir)
    try {
      rawBody = await req.json();
    } catch (e) {
      const textBody = await req.text();
      try {
        rawBody = JSON.parse(textBody);
      } catch (err) {
        rawBody = {};
      }
    }

    // Supsis parametresi: query
    let query = rawBody?.query || rawBody?.orderNumber || rawBody?.phone;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        found: false, 
        message: "Geçerli bir bilgi (sipariş numarası veya telefon) giriniz." 
      }, { status: 200, headers: corsHeaders });
    }

    query = query.trim();

    // Veritabanında query'ye göre sipariş arama (En güncel olanı)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: query },
          { phone: query }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ 
        found: false, 
        message: "Bu bilgilere ait sipariş bulunamadı." 
      }, { status: 200, headers: corsHeaders });
    }

    // Durum Çevirileri (Mevcut YENI/KARGODA vs ve PENDING formatı için)
    const statusMap: Record<string, string> = {
      'PENDING': 'Sipariş Alındı',
      'YENI': 'Sipariş Alındı',
      'PREPARING': 'Hazırlanıyor',
      'HAZIRLANIYOR': 'Hazırlanıyor',
      'SHIPPED': 'Kargoya Verildi',
      'KARGODA': 'Kargoya Verildi',
      'DELIVERED': 'Teslim Edildi',
      'TESLIM_EDILDI': 'Teslim Edildi',
      'CANCELLED': 'İptal Edildi',
      'IPTAL': 'İptal Edildi'
    };

    const translatedStatus = String(statusMap[order.status] || order.status);
    const productName = String(order.orderItems?.[0]?.product?.name || "Ürün");

    // Tarihi DD.MM.YYYY formatında oluşturma
    const orderDate = new Date(order.createdAt);
    const dateStr = String(`${String(orderDate.getDate()).padStart(2, '0')}.${String(orderDate.getMonth() + 1).padStart(2, '0')}.${orderDate.getFullYear()}`);

    // Kargo detay simülasyonu
    let cargoDetails = "Siparişiniz işleme alındı.";
    if (translatedStatus === "Sipariş Alındı" || translatedStatus === "Hazırlanıyor") {
      cargoDetails = "Siparişiniz onaylandı, depoda paketleme sırasına alındı.";
    } else if (translatedStatus === "Kargoya Verildi") {
      cargoDetails = `Yurtiçi Kargo Takip No: YK-${String(order.id).slice(0, 8).toUpperCase()} (Aktarma Merkezinde, Dağıtıma Hazırlanıyor)`;
    } else if (translatedStatus === "Teslim Edildi") {
      cargoDetails = "Siparişiniz teslim edilmiştir.";
    }

    // Supsis tarafında array ("[...] ") sorunu olmaması için her şeyi düz string olarak dönüyoruz
    return NextResponse.json({
      found: true,
      orderNumber: String(order.orderNumber),
      status: translatedStatus,
      paymentMethod: String(order.paymentMethod),
      total: String(`${order.totalAmount} ₺`),
      productName: productName,
      date: dateStr,
      cargoDetails: cargoDetails
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Supsis Order Status Webhook Error:', error);
    // Supsis akışını kırmamak için her zaman 200 dönüyoruz
    return NextResponse.json({ 
      found: false, 
      message: "Sipariş sorgulanırken geçici bir sistem hatası oluştu." 
    }, { status: 200, headers: corsHeaders });
  }
}
