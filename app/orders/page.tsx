'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        } else if (res.status === 401) {
          router.push('/auth/login?redirect=/orders');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'YENI':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Sipariş Alındı</span>;
      case 'HAZIRLANIYOR':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Hazırlanıyor</span>;
      case 'KARGODA':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">Kargoda</span>;
      case 'TESLIM_EDILDI':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Teslim Edildi</span>;
      case 'IPTAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">İptal Edildi</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">{status}</span>;
    }
  };

  const getPaymentMethod = (method: string) => {
    switch (method) {
      case 'KREDI_KARTI': return 'Kredi Kartı';
      case 'HAVALE': return 'Havale / EFT';
      case 'KAPIDA_ODEME': return 'Kapıda Ödeme';
      default: return method;
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex justify-center items-center">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Siparişlerim</h1>
        <p className="mt-2 text-sm text-slate-400">Geçmiş siparişlerinizi ve güncel durumlarını buradan takip edebilirsiniz.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">Henüz siparişiniz bulunmuyor</h3>
          <p className="text-slate-400 mb-6">Mağazamızdaki ürünleri keşfederek ilk siparişinizi oluşturabilirsiniz.</p>
          <button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Alışverişe Başla
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              {/* Order Header */}
              <div className="bg-slate-800/50 px-4 py-4 sm:px-6 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sipariş No</dt>
                    <dd className="mt-1 text-sm font-semibold text-white">{order.orderNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tarih</dt>
                    <dd className="mt-1 text-sm text-white">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">Toplam Tutar</dt>
                    <dd className="mt-1 text-sm font-semibold text-indigo-400">{order.totalAmount.toLocaleString('tr-TR')} ₺</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ödeme</dt>
                    <dd className="mt-1 text-sm text-white">{getPaymentMethod(order.paymentMethod)}</dd>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Items */}
              <div className="px-4 py-5 sm:p-6">
                <ul role="list" className="divide-y divide-slate-800">
                  {order.orderItems.map((item: any) => (
                    <li key={item.id} className="py-4 flex flex-col sm:flex-row">
                      <div className="flex-shrink-0 w-20 h-20 bg-slate-800 rounded-md border border-slate-700 overflow-hidden relative mb-4 sm:mb-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="sm:ml-6 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-medium text-white">{item.product.name}</h4>
                            <p className="mt-1 text-sm text-slate-400">{item.product.category}</p>
                          </div>
                          <p className="text-sm font-medium text-white whitespace-nowrap ml-4">
                            {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          <p>Adet: {item.quantity} x {item.price.toLocaleString('tr-TR')} ₺</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Delivery Info and Cargo Status */}
              <div className="bg-slate-800/30 px-4 py-4 sm:px-6 border-t border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Teslimat Bilgileri</h4>
                    <p className="text-sm text-slate-400">{order.customerName} - {order.phone}</p>
                    <p className="text-sm text-slate-400 mt-1">{order.address}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Kargo Takip Durumu</h4>
                    <div className="flex items-center">
                      {order.status === 'YENI' || order.status === 'HAZIRLANIYOR' ? (
                        <div className="bg-blue-900/30 border border-blue-800/50 text-blue-300 text-sm px-3 py-2.5 rounded-lg flex items-center w-full">
                          <span className="mr-2.5 text-base">📦</span> Siparişiniz onaylandı, depoda paketleme sırasına alındı.
                        </div>
                      ) : order.status === 'KARGODA' ? (
                        <div className="bg-indigo-900/30 border border-indigo-800/50 text-indigo-300 text-sm px-3 py-2.5 rounded-lg flex items-center w-full">
                          <span className="mr-2.5 text-base">🚚</span> Yurtiçi Kargo Takip No: YK-{order.id.slice(0, 8).toUpperCase()} (Dağıtıma Hazırlanıyor)
                        </div>
                      ) : order.status === 'TESLIM_EDILDI' ? (
                        <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-sm px-3 py-2.5 rounded-lg flex items-center w-full">
                          <span className="mr-2.5 text-base">✅</span> Teslim Edildi
                        </div>
                      ) : (
                        <div className="bg-slate-800/80 border border-slate-700 text-slate-400 text-sm px-3 py-2.5 rounded-lg flex items-center w-full">
                          <span className="mr-2.5 text-base">⏳</span> Siparişiniz işleme alındı.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
