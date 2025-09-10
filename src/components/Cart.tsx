'use client'

import { useState } from 'react'
import { X, Minus, Plus, ShoppingCart, MessageSquare } from 'lucide-react'
import { useCart } from './CartContext'
import { supabase } from '@/lib/supabase'
import { insertOrder, insertOrderItems, updateMenuStock } from '@/lib/supabase-helpers'
import toast from 'react-hot-toast'

interface CartProps {
  tableId: number
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ tableId, isOpen, onClose }: CartProps) {
  const { state, dispatch } = useCart()
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const updateQuantity = (menuId: number, newQuantity: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { menuId, quantity: newQuantity }
    })
  }

  const removeItem = (menuId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: menuId })
    toast.success('Item dihapus dari keranjang')
  }

  const updateNotes = (menuId: number, notes: string) => {
    dispatch({
      type: 'UPDATE_NOTES',
      payload: { menuId, notes }
    })
  }

  const submitOrder = async () => {
    if (state.items.length === 0) {
      toast.error('Keranjang kosong')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Starting order submission process...')
      
      // Step 1: Check stock availability first
      console.log('Checking stock availability...')
      for (const item of state.items) {
        if (item.menu.stock_quantity !== null) {
          const { data: currentMenu, error: stockError } = await supabase
            .from('menus')
            .select('stock_quantity, name')
            .eq('id', item.menu.id)
            .single()

          if (stockError) {
            console.error('Stock check error:', stockError)
            throw stockError
          }
          
          const menuData = currentMenu as { stock_quantity: number | null; name: string }
          console.log(`Stock check for ${menuData.name}: available=${menuData.stock_quantity}, requested=${item.quantity}`)
          
          if (menuData.stock_quantity !== null && menuData.stock_quantity < item.quantity) {
            toast.error(`Stok ${menuData.name} tidak mencukupi. Tersisa: ${menuData.stock_quantity}`)
            return
          }
        }
      }

      // Step 2: Create order
      console.log('Creating order...')
      const { data: order, error: orderError } = await insertOrder({
        table_id: tableId,
        total_amount: state.total,
        special_notes: orderNotes || null,
        status: 'pending'
      })

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }
      
      const orderData = order as { id: number }
      console.log('Order created with ID:', orderData.id)

      // Step 3: Create order items
      console.log('Creating order items...')
      const orderItems = state.items.map(item => ({
        order_id: orderData.id,
        menu_id: item.menu.id,
        quantity: item.quantity,
        price: item.menu.price,
        special_notes: item.specialNotes || null
      }))

      const { error: itemsError } = await insertOrderItems(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        throw itemsError
      }
      console.log('Order items created successfully')

      // Step 4: Update stock quantities using secure database function
      console.log('Updating stock quantities...')
      const stockUpdateErrors: string[] = []
      
      for (const item of state.items) {
        if (item.menu.stock_quantity !== null) {
          try {
            console.log(`Updating stock for ${item.menu.name}: subtracting ${item.quantity} from ${item.menu.stock_quantity}`)
            
            const { data: stockResult, error: stockUpdateError } = await updateMenuStock(item.menu.id, item.quantity)

            if (stockUpdateError) {
              console.error('Stock update error for item:', item.menu.name, stockUpdateError)
              const errorMsg = stockUpdateError instanceof Error ? stockUpdateError.message : String(stockUpdateError)
              stockUpdateErrors.push(`${item.menu.name}: ${errorMsg}`)
            } else if (stockResult && stockResult.success) {
              console.log(`✅ Stock updated successfully for ${item.menu.name}: ${stockResult.old_stock} -> ${stockResult.new_stock}`)
            } else if (stockResult && !stockResult.success) {
              console.error('Stock update failed:', item.menu.name, stockResult.error)
              stockUpdateErrors.push(`${item.menu.name}: ${stockResult.error || 'Unknown error'}`)
            } else {
              console.error('Stock update returned unexpected result:', item.menu.name, stockResult)
              stockUpdateErrors.push(`${item.menu.name}: Unexpected response format`)
            }
          } catch (stockError) {
            console.error('Stock update exception:', stockError)
            const errorMsg = stockError instanceof Error ? stockError.message : String(stockError)
            stockUpdateErrors.push(`${item.menu.name}: ${errorMsg}`)
          }
        }
      }

      // Show stock update errors but don't fail the entire order
      if (stockUpdateErrors.length > 0) {
        console.warn('Some stock updates failed:', stockUpdateErrors)
        toast.error('Pesanan berhasil, tetapi ada masalah dengan update stok. Silakan hubungi admin.')
      } else {
        console.log('✅ All stock updates completed successfully')
        toast.success('Pesanan berhasil dikirim!')
      }

      // Clear cart and redirect
      dispatch({ type: 'CLEAR_CART' })
      setOrderNotes('')
      onClose()
      
      // Redirect to order status page
      console.log('Redirecting to order status page...')
      window.location.href = `/table/${tableId}/order/${orderData.id}`
      
    } catch (error: unknown) {
      console.error('Error submitting order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Gagal mengirim pesanan: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-slate-900">Keranjang ({state.items.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Keranjang Kosong</p>
              <p className="text-sm text-center px-4">
                Tambahkan menu favorit Anda ke keranjang untuk melanjutkan pemesanan
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {state.items.map((item) => (
                <div key={item.menu.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.menu.name}</h3>
                      <p className="text-amber-600 font-medium">
                        {formatPrice(item.menu.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.menu.id)}
                      className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-800">Jumlah:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.menu.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
                      >
                        <Minus className="w-4 h-4 text-slate-700" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 bg-white py-1 px-2 rounded border border-slate-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menu.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
                      >
                        <Plus className="w-4 h-4 text-slate-700" />
                      </button>
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      Catatan khusus:
                    </label>
                    <textarea
                      value={item.specialNotes || ''}
                      onChange={(e) => updateNotes(item.menu.id, e.target.value)}
                      placeholder="Contoh: tanpa es, pedas level 2"
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500 bg-white"
                      rows={2}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-800">Subtotal:</span>
                      <span className="font-semibold text-amber-600">
                        {formatPrice(item.menu.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Notes */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-sm font-medium text-slate-800 flex items-center gap-1 mb-2">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  Catatan pesanan:
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk seluruh pesanan..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500 bg-white"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-slate-900">Total:</span>
                <span className="text-2xl font-bold text-amber-600">
                  {formatPrice(state.total)}
                </span>
              </div>
              <p className="text-sm text-slate-700 font-medium">
                Pembayaran dilakukan di kasir setelah pesanan siap
              </p>
            </div>
            
            <button
              onClick={submitOrder}
              disabled={isSubmitting}
              className="w-full bg-amber-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Memproses...' : 'Pesan Sekarang'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}