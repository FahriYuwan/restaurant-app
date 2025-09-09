'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, Coffee, Utensils } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  menus: Database['public']['Tables']['menus']['Row']
}
type Table = Database['public']['Tables']['tables']['Row']

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = parseInt(params.tableId as string)
  const orderId = parseInt(params.orderId as string)
  
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [table, setTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('table_id', tableId)
          .single()

        if (orderError || !orderData) {
          toast.error('Pesanan tidak ditemukan')
          router.push(`/table/${tableId}`)
          return
        }

        setOrder(orderData)

        // Fetch order items with menu details
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menus (*)
          `)
          .eq('order_id', orderId)

        if (itemsError) throw itemsError

        setOrderItems(itemsData || [])

        // Fetch table info
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .single()

        if (tableError) throw tableError

        setTable(tableData)
      } catch (error: any) {
        console.error('Error fetching order data:', error)
        toast.error('Terjadi kesalahan saat memuat data pesanan')
      } finally {
        setLoading(false)
      }
    }

    if (orderId && tableId) {
      fetchOrderData()
    }
  }, [orderId, tableId, router])

  // Subscribe to order status updates
  useEffect(() => {
    if (!orderId) return

    const subscription = supabase
      .channel('order_status')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, 
        (payload) => {
          setOrder(payload.new as Order)
          
          // Show toast notification for status changes
          const newStatus = payload.new.status
          switch (newStatus) {
            case 'preparing':
              toast.success('Pesanan sedang diproses!')
              break
            case 'ready':
              toast.success('Pesanan sudah siap! Silakan ambil di counter.')
              break
            case 'delivered':
              toast.success('Pesanan telah diantar. Selamat menikmati!')
              break
            case 'cancelled':
              toast.error('Pesanan dibatalkan')
              break
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Menunggu Konfirmasi',
          description: 'Pesanan Anda sedang menunggu konfirmasi dari barista',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        }
      case 'preparing':
        return {
          text: 'Sedang Diproses',
          description: 'Barista sedang menyiapkan pesanan Anda',
          icon: Coffee,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      case 'ready':
        return {
          text: 'Siap Disajikan',
          description: 'Pesanan sudah siap, silakan ambil di counter',
          icon: Utensils,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'delivered':
        return {
          text: 'Selesai',
          description: 'Pesanan telah diantar. Selamat menikmati!',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'cancelled':
        return {
          text: 'Dibatalkan',
          description: 'Pesanan telah dibatalkan',
          icon: Clock,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      default:
        return {
          text: 'Status Tidak Diketahui',
          description: '',
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Memuat status pesanan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <p className=\"text-gray-600\">Pesanan tidak ditemukan</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Header */}
      <div className=\"bg-white shadow-sm\">
        <div className=\"px-4 py-4\">
          <div className=\"flex items-center gap-3 mb-4\">
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className=\"p-2 hover:bg-gray-100 rounded-full transition-colors\"
            >
              <ArrowLeft className=\"w-6 h-6\" />
            </button>
            <div>
              <h1 className=\"text-xl font-bold text-gray-900\">
                Status Pesanan #{order.id}
              </h1>
              <p className=\"text-sm text-gray-600\">
                Meja {table?.table_number} • {new Date(order.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className=\"px-4 py-6 space-y-6\">
        {/* Status Card */}
        <div className=\"bg-white rounded-2xl shadow-sm border border-gray-100 p-6\">
          <div className=\"text-center\">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
            </div>
            <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">{statusInfo.text}</h2>
            <p className=\"text-gray-600\">{statusInfo.description}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className=\"bg-white rounded-2xl shadow-sm border border-gray-100 p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Detail Pesanan</h3>
          <div className=\"space-y-4\">
            {orderItems.map((item) => (
              <div key={item.id} className=\"flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0\">
                <div className=\"flex-1\">
                  <h4 className=\"font-medium text-gray-900\">{item.menus.name}</h4>
                  <p className=\"text-sm text-gray-600\">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                  {item.special_notes && (
                    <p className=\"text-sm text-amber-600 italic mt-1\">
                      Catatan: {item.special_notes}
                    </p>
                  )}
                </div>
                <div className=\"text-right\">
                  <p className=\"font-semibold text-gray-900\">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {order.special_notes && (
            <div className=\"mt-4 p-4 bg-amber-50 rounded-lg\">
              <h4 className=\"font-medium text-amber-800 mb-1\">Catatan Pesanan:</h4>
              <p className=\"text-amber-700\">{order.special_notes}</p>
            </div>
          )}

          <div className=\"mt-6 pt-4 border-t border-gray-200\">
            <div className=\"flex justify-between items-center\">
              <span className=\"text-lg font-semibold text-gray-900\">Total:</span>
              <span className=\"text-2xl font-bold text-amber-600\">
                {formatPrice(order.total_amount)}
              </span>
            </div>
            <p className=\"text-sm text-gray-600 mt-1\">
              Pembayaran dilakukan di kasir
            </p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className=\"bg-white rounded-2xl shadow-sm border border-gray-100 p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Progress Pesanan</h3>
          <div className=\"space-y-4\">
            {[
              { status: 'pending', label: 'Menunggu Konfirmasi' },
              { status: 'preparing', label: 'Sedang Diproses' },
              { status: 'ready', label: 'Siap Disajikan' },
              { status: 'delivered', label: 'Selesai' }
            ].map((step, index) => {
              const isCompleted = order.status === step.status || 
                                (order.status === 'preparing' && step.status === 'pending') ||
                                (order.status === 'ready' && ['pending', 'preparing'].includes(step.status)) ||
                                (order.status === 'delivered' && ['pending', 'preparing', 'ready'].includes(step.status))
              
              const isCurrent = order.status === step.status
              
              return (
                <div key={step.status} className=\"flex items-center gap-3\">
                  <div className={`w-4 h-4 rounded-full ${
                    isCompleted ? 'bg-green-500' : 
                    isCurrent ? 'bg-amber-500' : 'bg-gray-300'
                  }`} />
                  <span className={`${
                    isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className=\"flex gap-3\">
          <button
            onClick={() => router.push(`/table/${tableId}`)}
            className=\"flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors\"
          >
            Pesan Lagi
          </button>
          {order.status === 'delivered' && (
            <button
              onClick={() => router.push('/')}
              className=\"flex-1 bg-amber-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-amber-700 transition-colors\"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  )
}