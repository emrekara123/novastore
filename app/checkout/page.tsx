'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart, totalItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    paymentMethod: 'KREDI_KARTI'
  });

  const [error, setError] = useState('');

  // Fetch user data if logged in
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setFormData(prev => ({
            ...prev,
            customerName: data.user.name || '',
            phone: data.user.phone || '',
            address: data.user.address || ''
          }));
        } else {
          // If not logged in, redirect to login
          router.push('/auth/login?redirect=/checkout');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [router]);

  // If cart is empty, redirect back
  useEffect(() => {
    if (cart.length === 0 && user) {
      router.push('/');
    }
  }, [cart.length, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount: totalPrice,
          ...formData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sipariş tamamlanamadı.');
      }

      // Success
      clearCart();
      alert('Siparişiniz başarıyla alındı! Sipariş No: ' + data.order.orderNumber);
      router.push('/orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || cart.length === 0) {
    return <div className="min-h-screen flex justify-center items-center">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Siparişi Tamamla</h1>
        <p className="mt-2 text-sm text-slate-400">Ödeme ve teslimat bilgilerinizi girerek siparişinizi onaylayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
        
        {/* Form Section */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-4 text-sm">
                {error}
              </div>
            )}

            {/* Teslimat Bilgileri */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-6">1. Teslimat Bilgileri</h2>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label htmlFor="customerName" className="block text-sm font-medium text-slate-300">Ad Soyad</label>
                  <input
                    type="text"
                    id="customerName"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="mt-1 block w-full border border-slate-700 bg-slate-800 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300">Telefon Numarası (WhatsApp/SMS)</label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full border border-slate-700 bg-slate-800 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-300">Açık Adres</label>
                  <textarea
                    id="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1 block w-full border border-slate-700 bg-slate-800 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Mahalle, sokak, no, ilçe/il"
                  />
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-6">2. Ödeme Yöntemi</h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="KREDI_KARTI"
                    checked={formData.paymentMethod === 'KREDI_KARTI'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                  <span className="ml-3 font-medium text-white">Kredi / Banka Kartı (Simülasyon)</span>
                </label>
                <label className="flex items-center p-4 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="HAVALE"
                    checked={formData.paymentMethod === 'HAVALE'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                  <span className="ml-3 font-medium text-white">Havale / EFT</span>
                </label>
                <label className="flex items-center p-4 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="KAPIDA_ODEME"
                    checked={formData.paymentMethod === 'KAPIDA_ODEME'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                  <span className="ml-3 font-medium text-white">Kapıda Ödeme (Nakit / Kart)</span>
                </label>
              </div>

              {formData.paymentMethod === 'HAVALE' && (
                <div className="mt-6 bg-slate-800 border border-indigo-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-indigo-400 mb-2">Banka Hesap Bilgileri</h4>
                  <p className="text-sm text-slate-300 mb-1"><span className="text-slate-400">Banka:</span> Nova Bank A.Ş.</p>
                  <p className="text-sm text-slate-300 mb-1"><span className="text-slate-400">Alıcı:</span> NovaStore Teknoloji Tic. Ltd.</p>
                  <p className="text-sm text-slate-300 font-mono"><span className="text-slate-400">IBAN:</span> TR99 0000 0000 0000 0000 0000 00</p>
                  <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-200">
                    <strong>Önemli Not:</strong> Lütfen havale açıklamasına adınızı ve soyadınızı yazmayı unutmayın. Siparişiniz ödeme onayından sonra kargoya verilecektir.
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'KREDI_KARTI' && (
                <div className="mt-6 bg-slate-800 rounded-lg p-4 opacity-75">
                  <p className="text-sm text-slate-400 text-center">Güvenli ödeme simülasyonu. Gerçek kart bilgisi girmeyiniz.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'İşleniyor...' : 'Siparişi Onayla ve Bitir'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-medium text-white mb-6">Sipariş Özeti</h2>
            
            <ul role="list" className="divide-y divide-slate-800 mb-6">
              {cart.map((item) => (
                <li key={item.product.id} className="py-4 flex">
                  <div className="flex-shrink-0 w-16 h-16 rounded-md border border-slate-700 overflow-hidden relative">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-center">
                    <h3 className="text-sm font-medium text-white line-clamp-1">{item.product.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Adet: {item.quantity}</p>
                  </div>
                  <div className="ml-4 flex items-center justify-end text-sm font-medium text-white whitespace-nowrap">
                    {(item.product.price * item.quantity).toLocaleString('tr-TR')} ₺
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between">
                <dt>Ara Toplam ({totalItems} ürün)</dt>
                <dd className="font-medium text-white">{totalPrice.toLocaleString('tr-TR')} ₺</dd>
              </div>
              <div className="flex justify-between">
                <dt>Kargo Ücreti</dt>
                <dd className="font-medium text-emerald-400">Ücretsiz</dd>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-4 items-center">
                <dt className="text-base font-medium text-white">Ödenecek Tutar</dt>
                <dd className="text-xl font-bold text-indigo-400">{totalPrice.toLocaleString('tr-TR')} ₺</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
