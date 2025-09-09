'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus } from 'lucide-react'
import { Database } from '@/lib/database.types'
import { useCart } from './CartContext'
import toast from 'react-hot-toast'

type Menu = Database['public']['Tables']['menus']['Row']

interface MenuItemProps {
  menu: Menu
}

export default function MenuItem({ menu }: MenuItemProps) {
  const [quantity, setQuantity] = useState(1)
  const [specialNotes, setSpecialNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const { dispatch } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        menu,
        quantity,
        specialNotes: specialNotes || undefined
      }
    })
    toast.success(`${menu.name} ditambahkan ke keranjang`)
    setQuantity(1)
    setSpecialNotes('')
    setShowNotes(false)
  }

  const isAvailable = menu.is_available && (menu.stock_quantity === null || menu.stock_quantity > 0)

  return (
    <div className=\"bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden\">\n      {/* Menu Image */}\n      <div className=\"aspect-[4/3] bg-gray-100 relative\">\n        {menu.image_url ? (\n          <Image\n            src={menu.image_url}\n            alt={menu.name}\n            fill\n            className=\"object-cover\"\n          />\n        ) : (\n          <div className=\"flex items-center justify-center h-full text-gray-400\">\n            <div className=\"text-center\">\n              <div className=\"w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2\"></div>\n              <p className=\"text-sm\">No Image</p>\n            </div>\n          </div>\n        )}\n        \n        {!isAvailable && (\n          <div className=\"absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center\">\n            <span className=\"text-white font-semibold bg-red-600 px-3 py-1 rounded-full text-sm\">\n              Habis\n            </span>\n          </div>\n        )}\n      </div>\n\n      {/* Menu Info */}\n      <div className=\"p-4\">\n        <div className=\"mb-2\">\n          <h3 className=\"font-semibold text-lg text-gray-900\">{menu.name}</h3>\n          <span className=\"inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full\">\n            {menu.category}\n          </span>\n        </div>\n        \n        {menu.description && (\n          <p className=\"text-gray-600 text-sm mb-3 line-clamp-2\">{menu.description}</p>\n        )}\n        \n        <div className=\"flex items-center justify-between mb-4\">\n          <span className=\"text-xl font-bold text-amber-600\">\n            {formatPrice(menu.price)}\n          </span>\n          {menu.stock_quantity !== null && (\n            <span className=\"text-sm text-gray-500\">\n              Stok: {menu.stock_quantity}\n            </span>\n          )}\n        </div>\n\n        {isAvailable && (\n          <div className=\"space-y-3\">\n            {/* Quantity Control */}\n            <div className=\"flex items-center justify-between\">\n              <span className=\"text-sm font-medium text-gray-700\">Jumlah:</span>\n              <div className=\"flex items-center gap-3\">\n                <button\n                  onClick={() => setQuantity(Math.max(1, quantity - 1))}\n                  className=\"w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors\"\n                >\n                  <Minus className=\"w-4 h-4\" />\n                </button>\n                <span className=\"w-8 text-center font-semibold\">{quantity}</span>\n                <button\n                  onClick={() => setQuantity(quantity + 1)}\n                  className=\"w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors\"\n                >\n                  <Plus className=\"w-4 h-4\" />\n                </button>\n              </div>\n            </div>\n\n            {/* Special Notes Toggle */}\n            <button\n              onClick={() => setShowNotes(!showNotes)}\n              className=\"text-sm text-amber-600 hover:text-amber-700 transition-colors\"\n            >\n              {showNotes ? 'Sembunyikan catatan' : 'Tambah catatan khusus'}\n            </button>\n\n            {/* Special Notes Input */}\n            {showNotes && (\n              <textarea\n                value={specialNotes}\n                onChange={(e) => setSpecialNotes(e.target.value)}\n                placeholder=\"Contoh: tanpa es, pedas level 2, dll.\"\n                className=\"w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent\"\n                rows={2}\n              />\n            )}\n\n            {/* Add to Cart Button */}\n            <button\n              onClick={handleAddToCart}\n              className=\"w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors\"\n            >\n              Tambah ke Keranjang\n            </button>\n          </div>\n        )}\n\n        {!isAvailable && (\n          <div className=\"text-center py-2\">\n            <span className=\"text-gray-500 text-sm\">Menu tidak tersedia</span>\n          </div>\n        )}\n      </div>\n    </div>\n  )\n}