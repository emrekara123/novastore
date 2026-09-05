import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional, but good for idempotent seeds)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@novastore.com' },
    update: {},
    create: {
      email: 'admin@novastore.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+905550000000',
    },
  });

  // Create Customer
  const customerPassword = await bcrypt.hash('test123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'musteri@test.com' },
    update: {},
    create: {
      email: 'musteri@test.com',
      name: 'Test Müşteri',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+905551112233',
    },
  });

  // Create Products
  const products = [
    {
      code: 'PRD-101',
      name: 'Sony WH-1000XM5 Kulaklık',
      description: 'Gürültü engelleme özellikli premium kablosuz kulaklık.',
      price: 12500,
      stock: 50,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800',
    },
    {
      code: 'PRD-102',
      name: 'Apple Watch Series 9',
      description: 'Gelişmiş sağlık ve fitness özelliklerine sahip akıllı saat.',
      price: 15999,
      stock: 30,
      category: 'Giyilebilir Teknoloji',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
    },
    {
      code: 'PRD-103',
      name: 'North Face Borealis Sırt Çantası',
      description: 'Günlük kullanım ve doğa yürüyüşleri için dayanıklı sırt çantası.',
      price: 3499,
      stock: 100,
      category: 'Aksesuar',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
    },
    {
      code: 'PRD-104',
      name: 'Stanley Klasik Termos 1.9L',
      description: '24 saat sıcak/soğuk tutma kapasiteli paslanmaz çelik termos.',
      price: 2199,
      stock: 200,
      category: 'Kamp & Doğa',
      image: 'https://images.unsplash.com/photo-1606041011872-59659ceb7eb8?auto=format&fit=crop&q=80&w=800',
    },
    {
      code: 'PRD-105',
      name: 'Nike Phantom GX Krampon',
      description: 'Profesyonel futbolcular için üstün kontrol sağlayan krampon.',
      price: 4999,
      stock: 45,
      category: 'Spor',
      image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
    },
    {
      code: 'PRD-106',
      name: 'Logitech MX Master 3S',
      description: 'Üst düzey performanslı ve ergonomik kablosuz mouse.',
      price: 3299,
      stock: 75,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
