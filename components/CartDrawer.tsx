'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="h-full w-full bg-slate-900 border-l border-slate-800 shadow-xl flex flex-col transform transition-transform ease-in-out duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
            <h2 className="text-lg font-medium text-white">Sepetim</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <p>Sepetiniz şu an boş.</p>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Alışverişe Başla &rarr;
                </button>
              </div>
            ) : (
              <ul role="list" className="-my-6 divide-y divide-slate-800">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-700 relative">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover object-center"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-white">
                          <h3>{item.product.name}</h3>
                          <p className="ml-4 whitespace-nowrap">{item.product.price.toLocaleString('tr-TR')} ₺</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{item.product.code}</p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        
                        <div className="flex items-center border border-slate-700 rounded-md">
                          <button
                            type="button"
                            className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-white border-l border-r border-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex">
                          <button
                            type="button"
                            className="font-medium text-red-500 hover:text-red-400"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-6 sm:px-6">
              <div className="flex justify-between text-base font-medium text-white mb-4">
                <p>Ara Toplam</p>
                <p>{totalPrice.toLocaleString('tr-TR')} ₺</p>
              </div>
              <p className="mt-0.5 text-sm text-slate-400 mb-6">
                Kargo ve vergiler ödeme adımında hesaplanır.
              </p>
              <div className="mt-6">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 w-full"
                >
                  Siparişi Tamamla
                </Link>
              </div>
              <div className="mt-6 flex justify-center text-center text-sm text-slate-400">
                <p>
                  veya{' '}
                  <button
                    type="button"
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Alışverişe Devam Et
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
