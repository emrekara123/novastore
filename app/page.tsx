'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCart, Product } from '@/context/CartContext';

const CATEGORIES = ['Tümü', 'Elektronik', 'Giyilebilir Teknoloji', 'Aksesuar', 'Kamp & Doğa', 'Spor'];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== 'Tümü') queryParams.append('category', selectedCategory);
        if (searchQuery) queryParams.append('search', searchQuery);

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
          <span className="block">NovaStore'a Hoş Geldiniz</span>
          <span className="block text-indigo-500">Kalite ve Hız Bir Arada</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-slate-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          En yeni teknolojiler, en trend ürünler burada. Şimdi alışverişe başlayın.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div className="flex overflow-x-auto space-x-2 pb-2 md:pb-0 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-md py-2 pl-4 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-lg">Bu kategoride veya aramada ürün bulunamadı.</p>
          <button 
            onClick={() => { setSelectedCategory('Tümü'); setSearchQuery(''); }}
            className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300 flex flex-col">
              <div className="relative h-56 w-full bg-slate-800 group">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Son {product.stock} ürün!
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Tükendi
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-indigo-400 font-semibold">{/* product.category is in product but in context we just have basic info, actually api returns all fields */}
                    {(product as any).category}
                  </div>
                  <div className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {product.code}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{(product as any).description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-xl font-bold text-emerald-400">{product.price.toLocaleString('tr-TR')} ₺</span>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sepete Ekle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
