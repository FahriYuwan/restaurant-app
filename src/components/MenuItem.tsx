'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus } from 'lucide-react'
import { Database } from '@/lib/database.types'
import { useCart } from './CartContext'
import { supabase } from '@/lib/supabase'
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

  // Function to get default image based on category
  const getDefaultImage = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'kopi':
        return '/menu-images/coffee.svg';
      case 'makanan':
        return '/menu-images/food.svg';
      case 'minuman':
        return '/menu-images/drink.svg';
      case 'snack':
        return '/menu-images/snack.svg';
      case 'dessert':
        return '/menu-images/dessert.svg';
      default:
        return '/menu-images/food.svg';
    }
  };

  const handleAddToCart = async () => {
    // Check current stock if item has stock tracking
    if (menu.stock_quantity !== null) {
      try {
        const { data: currentMenu, error } = await supabase
          .from('menus')
          .select('stock_quantity')
          .eq('id', menu.id)
          .single()

        if (error) throw error
        
        const menuData = currentMenu as { stock_quantity: number | null }
        if (menuData.stock_quantity !== null && menuData.stock_quantity < quantity) {
          toast.error(`Stok ${menu.name} tidak mencukupi. Tersisa: ${menuData.stock_quantity}`)
          return
        }
      } catch (error) {
        console.error('Error checking stock:', error)
        toast.error('Gagal memeriksa stok')
        return
      }
    }

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Menu Image */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src={getDefaultImage(menu.category)}
            alt={menu.name}
            fill
            className="object-cover"
          />
        )}
        
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded-full text-sm">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Menu Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-slate-900">{menu.name}</h3>
          <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
            {menu.category}
          </span>
        </div>
        
        {menu.description && (
          <p className="text-slate-700 font-medium text-sm mb-3 line-clamp-2">{menu.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-amber-600">
            {formatPrice(menu.price)}
          </span>
          {menu.stock_quantity !== null && (
            <span className="text-sm text-slate-600 font-medium">
              Stok: {menu.stock_quantity}
            </span>
          )}
        </div>

        {isAvailable && (
          <div className="space-y-3">
            {/* Quantity Control */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Jumlah:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  <Minus className="w-4 h-4 text-slate-700" />
                </button>
                <span className="w-8 text-center font-bold text-slate-900 bg-slate-50 py-1 rounded">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  <Plus className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Special Notes Toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
            >
              {showNotes ? 'Sembunyikan catatan' : 'Tambah catatan khusus'}
            </button>

            {/* Special Notes Input */}
            {showNotes && (
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Contoh: tanpa es, pedas level 2, dll."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500 bg-white"
                rows={2}
              />
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
            >
              Tambah ke Keranjang
            </button>
          </div>
        )}

        {!isAvailable && (
          <div className="text-center py-2">
            <span className="text-gray-500 text-sm">Menu tidak tersedia</span>
          </div>
        )}
      </div>
    </div>
  )
}