const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('test123', 10);

  // 1. Admin kullanıcısı oluştur
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@novastore.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@novastore.com',
      password: adminPassword,
      phone: '+905550000000',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created/exists:', adminUser.email);

  // 2. Müşteri kullanıcısı oluştur
  const customerUser = await prisma.user.upsert({
    where: { email: 'musteri@test.com' },
    update: {},
    create: {
      name: 'Müşteri',
      email: 'musteri@test.com',
      password: customerPassword,
      phone: '+905551112233',
      role: 'CUSTOMER',
    },
  });
  console.log('Customer user created/exists:', customerUser.email);

  // 3. 6 adet ürün oluştur
  const products = [
    {
      code: 'PRD-101',
      name: 'Sony WH-1000XM5 Kulaklık',
      description: 'Aktif gürültü engelleme özellikli kablosuz kulaküstü kulaklık.',
      price: 12500,
      stock: 50,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600&auto=format&fit=crop',
    },
    {
      code: 'PRD-102',
      name: 'Apple Watch Series 9',
      description: 'Gelişmiş sağlık ve fitness özelliklerine sahip akıllı saat.',
      price: 16999,
      stock: 30,
      category: 'Giyilebilir Teknoloji',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop',
    },
    {
      code: 'PRD-103',
      name: 'North Face Borealis Sırt Çantası',
      description: 'Günlük kullanım ve doğa yürüyüşleri için dayanıklı sırt çantası.',
      price: 3450,
      stock: 100,
      category: 'Çanta',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop',
    },
    {
      code: 'PRD-104',
      name: 'Stanley Klasik Termos 1.9L',
      description: 'İçeceklerinizi 45 saate kadar sıcak/soğuk tutan çelik termos.',
      price: 2100,
      stock: 200,
      category: 'Kamp & Outdoor',
      image: 'https://images.unsplash.com/photo-1614088915525-4c0175b5b481?q=80&w=600&auto=format&fit=crop',
    },
    {
      code: 'PRD-105',
      name: 'Nike Phantom GX Krampon',
      description: 'Profesyonel futbolcular için tasarlanmış yüksek performanslı krampon.',
      price: 6800,
      stock: 45,
      category: 'Spor Giyim',
      image: 'https://images.unsplash.com/photo-1620188526357-ff08e03da266?q=80&w=600&auto=format&fit=crop',
    },
    {
      code: 'PRD-106',
      name: 'Logitech MX Master 3S',
      description: 'Ergonomik tasarım ve ultra hızlı kaydırma tekerleğine sahip kablosuz mouse.',
      price: 3850,
      stock: 80,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log('6 products created/exist.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
