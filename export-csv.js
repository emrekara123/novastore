const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportProducts() {
  try {
    const products = await prisma.product.findMany();
    
    // Create CSV header
    let csvContent = 'ID,Ürün Adı,Kategori,Fiyat (₺),Stok\n';
    
    // Append rows
    products.forEach(product => {
      // Escape commas and quotes for CSV
      const name = `"${product.name.replace(/"/g, '""')}"`;
      const category = `"${product.category.replace(/"/g, '""')}"`;
      const price = product.price;
      const stock = product.stock;
      const id = product.id;
      
      csvContent += `${id},${name},${category},${price},${stock}\n`;
    });
    
    fs.writeFileSync('urunler.csv', csvContent, 'utf8');
    console.log('urunler.csv başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportProducts();
