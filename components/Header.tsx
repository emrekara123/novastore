'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { totalItems, setIsCartOpen } = useCart();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-slate-950 text-slate-100 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
              NovaStore
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Ürünler
            </Link>
            <Link href="#" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Kategoriler
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-emerald-500 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <>
                <Link href="/orders" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Siparişlerim
                </Link>
                <Link href="/profile" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Profilim
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 font-bold px-3 py-2 text-sm transition-colors flex items-center gap-1">
                    <span>⚡</span> Admin Paneli
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
