'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/auth/login');
          return;
        }
        const userData = await userRes.json();
        if (userData.user.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        setIsAdmin(true);

        const ordersRes = await fetch('/api/admin/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [router]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Update local state to reflect the change immediately
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        // Toast notification (simple alert for now, can be replaced with a proper toast library)
        alert(`Sipariş durumu başarıyla "${newStatus}" olarak güncellendi.`);
      } else {
        alert('Durum güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Sistem hatası.');
    }
  };

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  // Calculate Stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(o => ['YENI', 'HAZIRLANIYOR'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'TESLIM_EDILDI').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Admin Yönetim Paneli</h1>
        <p className="mt-2 text-sm text-slate-400">Tüm siparişleri ve mağaza durumunu buradan yönetebilirsiniz.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-slate-900 overflow-hidden shadow rounded-lg border border-slate-800">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-slate-400 truncate">Toplam Sipariş</dt>
            <dd className="mt-1 text-3xl font-semibold text-white">{totalOrders}</dd>
          </div>
        </div>
        <div className="bg-slate-900 overflow-hidden shadow rounded-lg border border-slate-800">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-slate-400 truncate">Toplam Ciro</dt>
            <dd className="mt-1 text-3xl font-semibold text-emerald-400">{totalRevenue.toLocaleString('tr-TR')} ₺</dd>
          </div>
        </div>
        <div className="bg-slate-900 overflow-hidden shadow rounded-lg border border-slate-800">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-slate-400 truncate">Bekleyen Siparişler</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-400">{pendingOrders}</dd>
          </div>
        </div>
        <div className="bg-slate-900 overflow-hidden shadow rounded-lg border border-slate-800">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-slate-400 truncate">Teslim Edilenler</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-400">{deliveredOrders}</dd>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 shadow rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-4 py-5 border-b border-slate-800 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-white">Son Siparişler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Sipariş No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Müşteri & Telefon</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tarih</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tutar / Ödeme</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Durum</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-slate-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <div className="font-semibold text-emerald-400">{order.totalAmount.toLocaleString('tr-TR')} ₺</div>
                    <div className="text-xs text-slate-500">{order.paymentMethod.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`block w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-indigo-500 appearance-none text-center cursor-pointer
                        ${order.status === 'YENI' ? 'bg-blue-900/50 text-blue-200' :
                          order.status === 'HAZIRLANIYOR' ? 'bg-yellow-900/50 text-yellow-200' :
                          order.status === 'KARGODA' ? 'bg-indigo-900/50 text-indigo-200' :
                          order.status === 'TESLIM_EDILDI' ? 'bg-emerald-900/50 text-emerald-200' :
                          'bg-red-900/50 text-red-200'
                        }`}
                    >
                      <option value="YENI">YENİ</option>
                      <option value="HAZIRLANIYOR">HAZIRLANIYOR</option>
                      <option value="KARGODA">KARGODA</option>
                      <option value="TESLIM_EDILDI">TESLİM EDİLDİ</option>
                      <option value="IPTAL">İPTAL</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background Overlay */}
            <div 
              className="fixed inset-0 bg-black/75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedOrder(null)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-slate-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full border border-slate-700">
              <div className="bg-slate-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-5 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl leading-6 font-semibold text-white" id="modal-title">
                      Sipariş Detayı ({selectedOrder.orderNumber})
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{new Date(selectedOrder.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6 bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Teslimat Bilgileri</h4>
                  <p className="text-white font-medium">{selectedOrder.customerName}</p>
                  <p className="text-slate-300">{selectedOrder.phone}</p>
                  <p className="text-slate-400 text-sm mt-2">{selectedOrder.address}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">Sipariş Edilen Ürünler</h4>
                  <ul role="list" className="divide-y divide-slate-800">
                    {selectedOrder.orderItems.map((item: any) => (
                      <li key={item.id} className="py-3 flex">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-slate-700 relative">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="ml-4 flex flex-1 flex-col justify-center">
                          <div className="flex justify-between text-sm font-medium text-white">
                            <h3>{item.product.name}</h3>
                            <p className="ml-4">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">Adet: {item.quantity}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t border-slate-800 pt-4 flex justify-between items-center">
                    <span className="text-white font-medium">Toplam Ödenen:</span>
                    <span className="text-xl font-bold text-emerald-400">{selectedOrder.totalAmount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
