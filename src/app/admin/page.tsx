'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, Coffee, Utensils, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { updateOrder } from '@/lib/supabase-helpers'
import { restoreMenuStock } from '@/lib/supabase-helpers'
import { Database } from '@/lib/database.types'
import { notificationSound } from '@/lib/notification-sound'
import toast from 'react-hot-toast'

type Order = Database['public']['Tables']['orders']['Row'] & {
  tables: Database['public']['Tables']['tables']['Row']
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    menus: Database['public']['Tables']['menus']['Row'] | null
  })[]
}

// Define type for order items when fetching separately
type OrderItemWithMenu = Database['public']['Tables']['order_items']['Row'] & {
  menus: Database['public']['Tables']['menus']['Row'] | null
}

interface OrderUpdateData {
  status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  updated_at?: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)

  useEffect(() => {
    fetchOrders()
    subscribeToOrderChanges()
    
    // Set sound preference from localStorage
    const soundPref = localStorage.getItem('admin-sound-enabled')
    if (soundPref !== null) {
      const enabled = soundPref === 'true'
      setSoundEnabled(enabled)
      notificationSound.setEnabled(enabled)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (*),
          order_items (
            *,
            menus (*)
          )
        `)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const newOrders = (data || []) as Order[]
      const pendingOrders = newOrders.filter(order => order.status === 'pending')
      
      // Play sound for new orders (only if order count increased)
      if (pendingOrders.length > lastOrderCount && lastOrderCount > 0) {
        notificationSound.playNewOrderSound()
        toast.success(`${pendingOrders.length - lastOrderCount} new order(s) received!`)
      }
      
      setOrders(newOrders)
      setLastOrderCount(pendingOrders.length)
    } catch (error: unknown) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToOrderChanges = () => {
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders'
        }, 
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const updateOrderStatus = async (orderId: number, newStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled') => {
    setUpdatingStatus(orderId)
    try {
      // If cancelling an order, restore stock
      if (newStatus === 'cancelled') {
        // First, get the order items to know what stock to restore
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            menus (id, name, stock_quantity)
          `)
          .eq('order_id', orderId)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          toast.error('Failed to fetch order items for stock restoration')
        } else {
          // Restore stock for each item
          const stockRestoreErrors: string[] = []
          
          for (const item of orderItems) {
            // Fix: properly access the menu data by casting to the correct type
            const orderItem = item as OrderItemWithMenu;
            if (orderItem.menus && orderItem.menus.id) {
              try {
                console.log(`Restoring stock for ${orderItem.menus.name}: adding ${orderItem.quantity}`)
              
                const { data: stockResult, error: stockRestoreError } = await restoreMenuStock(
                  orderItem.menus.id, 
                  orderItem.quantity
                )

                if (stockRestoreError) {
                  console.error('Stock restore error for item:', orderItem.menus.name, stockRestoreError)
                  const errorMsg = stockRestoreError instanceof Error ? stockRestoreError.message : String(stockRestoreError)
                  stockRestoreErrors.push(`${orderItem.menus.name}: ${errorMsg}`)
                } else if (stockResult && stockResult.success) {
                  console.log(`✅ Stock restored successfully for ${orderItem.menus.name}: ${stockResult.old_stock} -> ${stockResult.new_stock}`)
                } else if (stockResult && !stockResult.success) {
                  console.error('Stock restore failed:', orderItem.menus.name, stockResult.error)
                  stockRestoreErrors.push(`${orderItem.menus.name}: ${stockResult.error || 'Unknown error'}`)
                } else {
                  console.error('Stock restore returned unexpected result:', orderItem.menus.name, stockResult)
                  stockRestoreErrors.push(`${orderItem.menus.name}: Unexpected response format`)
                }
              } catch (stockError) {
                console.error('Stock restore exception:', stockError)
                const errorMsg = stockError instanceof Error ? stockError.message : String(stockError)
                stockRestoreErrors.push(`${orderItem.menus.name}: ${errorMsg}`)
              }
            }
          }

          // Show stock restore errors but don't fail the entire cancellation
          if (stockRestoreErrors.length > 0) {
            console.warn('Some stock restorations failed:', stockRestoreErrors)
            toast.error('Order cancelled, but there were issues restoring stock. Please check manually.')
          } else {
            console.log('✅ All stock restorations completed successfully')
            toast.success('Order cancelled and stock restored successfully!')
          }
        }
      }

      const updatePayload: OrderUpdateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      const { error } = await updateOrder(orderId, updatePayload)

      if (error) throw error

      // Play appropriate sound
      if (newStatus === 'ready') {
        notificationSound.playCompletionSound()
      } else {
        notificationSound.playStatusUpdateSound()
      }

      toast.success(`Order status updated to ${newStatus}`)
      await fetchOrders()
    } catch (error: unknown) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-slate-100 text-slate-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'preparing':
        return <Coffee className="w-4 h-4" />
      case 'ready':
        return <Utensils className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing'
      case 'preparing':
        return 'ready'
      case 'ready':
        return 'delivered'
      default:
        return null
    }
  }

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'Start Preparing'
      case 'preparing':
        return 'Mark Ready'
      case 'ready':
        return 'Mark Delivered'
      default:
        return null
    }
  }

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabled(newSoundEnabled)
    notificationSound.setEnabled(newSoundEnabled)
    localStorage.setItem('admin-sound-enabled', newSoundEnabled.toString())
    toast.success(`Sound notifications ${newSoundEnabled ? 'enabled' : 'disabled'}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-700 font-medium">Manage incoming orders and update their status</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              soundEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={`Sound notifications ${soundEnabled ? 'enabled' : 'disabled'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {['pending', 'preparing', 'ready', 'cancelled'].map((status) => {
          const count = orders.filter(order => order.status === status).length
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs md:text-sm text-slate-600 font-medium capitalize truncate">{status}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <Coffee className="w-12 md:w-16 h-12 md:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No active orders</h3>
            <p className="text-slate-600 font-medium">New orders will appear here when customers place them</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">
                      Table {order.tables.table_number} • {new Date(order.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)} whitespace-nowrap`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold text-amber-600">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0 gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900">{item.menus?.name || 'Unknown Item'}</h4>
                      <p className="text-sm text-slate-600 font-medium">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                      {item.special_notes && (
                        <p className="text-sm text-amber-600 italic mt-1">
                          Note: {item.special_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Notes */}
              {order.special_notes && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-1">Order Notes:</h4>
                  <p className="text-amber-700">{order.special_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                    disabled={updatingStatus === order.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {updatingStatus === order.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {getNextStatusLabel(order.status)}
                  </button>
                )}
                
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    disabled={updatingStatus === order.id}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}