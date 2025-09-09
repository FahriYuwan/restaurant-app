'use client'

import { useState } from 'react'
import { X, Minus, Plus, ShoppingCart, MessageSquare } from 'lucide-react'
import { useCart } from './CartContext'
import { supabase } from '@/lib/supabase'
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
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          total_amount: state.total,
          special_notes: orderNotes || null,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = state.items.map(item => ({
        order_id: order.id,
        menu_id: item.menu.id,
        quantity: item.quantity,
        price: item.menu.price,
        special_notes: item.specialNotes || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      toast.success('Pesanan berhasil dikirim!')
      dispatch({ type: 'CLEAR_CART' })
      setOrderNotes('')
      onClose()
      
      // Redirect to order status page
      window.location.href = `/table/${tableId}/order/${order.id}`
    } catch (error: any) {
      console.error('Error submitting order:', error)
      toast.error('Gagal mengirim pesanan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className=\"fixed inset-0 z-50 overflow-hidden\">\n      {/* Backdrop */}\n      <div \n        className=\"absolute inset-0 bg-black bg-opacity-50\" \n        onClick={onClose}\n      />\n      \n      {/* Cart Panel */}\n      <div className=\"absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col\">\n        {/* Header */}\n        <div className=\"flex items-center justify-between p-4 border-b border-gray-200\">\n          <div className=\"flex items-center gap-2\">\n            <ShoppingCart className=\"w-6 h-6 text-amber-600\" />\n            <h2 className=\"text-xl font-semibold\">Keranjang ({state.items.length})</h2>\n          </div>\n          <button\n            onClick={onClose}\n            className=\"p-2 hover:bg-gray-100 rounded-full transition-colors\"\n          >\n            <X className=\"w-6 h-6\" />\n          </button>\n        </div>\n\n        {/* Cart Content */}\n        <div className=\"flex-1 overflow-y-auto\">\n          {state.items.length === 0 ? (\n            <div className=\"flex flex-col items-center justify-center h-full text-gray-500\">\n              <ShoppingCart className=\"w-16 h-16 mb-4 text-gray-300\" />\n              <p className=\"text-lg font-medium mb-2\">Keranjang Kosong</p>\n              <p className=\"text-sm text-center px-4\">\n                Tambahkan menu favorit Anda ke keranjang untuk melanjutkan pemesanan\n              </p>\n            </div>\n          ) : (\n            <div className=\"p-4 space-y-4\">\n              {state.items.map((item) => (\n                <div key={item.menu.id} className=\"bg-gray-50 rounded-xl p-4\">\n                  <div className=\"flex justify-between items-start mb-3\">\n                    <div className=\"flex-1\">\n                      <h3 className=\"font-semibold text-gray-900\">{item.menu.name}</h3>\n                      <p className=\"text-amber-600 font-medium\">\n                        {formatPrice(item.menu.price)}\n                      </p>\n                    </div>\n                    <button\n                      onClick={() => removeItem(item.menu.id)}\n                      className=\"p-1 hover:bg-gray-200 rounded-full transition-colors\"\n                    >\n                      <X className=\"w-4 h-4 text-gray-500\" />\n                    </button>\n                  </div>\n\n                  {/* Quantity Control */}\n                  <div className=\"flex items-center justify-between mb-3\">\n                    <span className=\"text-sm font-medium text-gray-700\">Jumlah:</span>\n                    <div className=\"flex items-center gap-3\">\n                      <button\n                        onClick={() => updateQuantity(item.menu.id, Math.max(1, item.quantity - 1))}\n                        className=\"w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border\"\n                      >\n                        <Minus className=\"w-4 h-4\" />\n                      </button>\n                      <span className=\"w-8 text-center font-semibold\">{item.quantity}</span>\n                      <button\n                        onClick={() => updateQuantity(item.menu.id, item.quantity + 1)}\n                        className=\"w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border\"\n                      >\n                        <Plus className=\"w-4 h-4\" />\n                      </button>\n                    </div>\n                  </div>\n\n                  {/* Special Notes */}\n                  <div className=\"space-y-2\">\n                    <label className=\"text-sm font-medium text-gray-700 flex items-center gap-1\">\n                      <MessageSquare className=\"w-4 h-4\" />\n                      Catatan khusus:\n                    </label>\n                    <textarea\n                      value={item.specialNotes || ''}\n                      onChange={(e) => updateNotes(item.menu.id, e.target.value)}\n                      placeholder=\"Contoh: tanpa es, pedas level 2\"\n                      className=\"w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent\"\n                      rows={2}\n                    />\n                  </div>\n\n                  {/* Subtotal */}\n                  <div className=\"mt-3 pt-3 border-t border-gray-200\">\n                    <div className=\"flex justify-between items-center\">\n                      <span className=\"text-sm font-medium text-gray-700\">Subtotal:</span>\n                      <span className=\"font-semibold text-amber-600\">\n                        {formatPrice(item.menu.price * item.quantity)}\n                      </span>\n                    </div>\n                  </div>\n                </div>\n              ))}\n\n              {/* Order Notes */}\n              <div className=\"bg-gray-50 rounded-xl p-4\">\n                <label className=\"text-sm font-medium text-gray-700 flex items-center gap-1 mb-2\">\n                  <MessageSquare className=\"w-4 h-4\" />\n                  Catatan pesanan:\n                </label>\n                <textarea\n                  value={orderNotes}\n                  onChange={(e) => setOrderNotes(e.target.value)}\n                  placeholder=\"Catatan tambahan untuk seluruh pesanan...\"\n                  className=\"w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent\"\n                  rows={3}\n                />\n              </div>\n            </div>\n          )}\n        </div>\n\n        {/* Footer */}\n        {state.items.length > 0 && (\n          <div className=\"border-t border-gray-200 p-4 bg-white\">\n            <div className=\"mb-4\">\n              <div className=\"flex justify-between items-center mb-2\">\n                <span className=\"text-lg font-semibold text-gray-900\">Total:</span>\n                <span className=\"text-2xl font-bold text-amber-600\">\n                  {formatPrice(state.total)}\n                </span>\n              </div>\n              <p className=\"text-sm text-gray-600\">\n                Pembayaran dilakukan di kasir setelah pesanan siap\n              </p>\n            </div>\n            \n            <button\n              onClick={submitOrder}\n              disabled={isSubmitting}\n              className=\"w-full bg-amber-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors\"\n            >\n              {isSubmitting ? 'Memproses...' : 'Pesan Sekarang'}\n            </button>\n          </div>\n        )}\n      </div>\n    </div>\n  )\n}