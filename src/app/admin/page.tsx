'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, Coffee, Utensils, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { notificationSound } from '@/lib/notification-sound'
import toast from 'react-hot-toast'

type Order = Database['public']['Tables']['orders']['Row'] & {
  tables: Database['public']['Tables']['tables']['Row']
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    menus: Database['public']['Tables']['menus']['Row']
  })[]
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
      
      const newOrders = data || []
      const pendingOrders = newOrders.filter(order => order.status === 'pending')
      
      // Play sound for new orders (only if order count increased)
      if (pendingOrders.length > lastOrderCount && lastOrderCount > 0) {
        notificationSound.playNewOrderSound()
        toast.success(`${pendingOrders.length - lastOrderCount} new order(s) received!`)
      }
      
      setOrders(newOrders)
      setLastOrderCount(pendingOrders.length)
    } catch (error: any) {
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

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Play appropriate sound
      if (newStatus === 'ready') {
        notificationSound.playCompletionSound()
      } else {
        notificationSound.playStatusUpdateSound()
      }

      toast.success(`Order status updated to ${newStatus}`)
      await fetchOrders()
    } catch (error: any) {
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
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage incoming orders and update their status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={`Sound notifications ${soundEnabled ? 'enabled' : 'disabled'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['pending', 'preparing', 'ready', 'cancelled'].map((status) => {
          const count = orders.filter(order => order.status === status).length
          return (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
            <p className="text-gray-600">New orders will appear here when customers place them</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Table {order.tables.table_number} • {new Date(order.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-600">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.menus.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                      {item.special_notes && (
                        <p className="text-sm text-amber-600 italic mt-1">
                          Note: {item.special_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Notes */}
              {order.special_notes && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-1">Order Notes:</h4>
                  <p className="text-amber-700">{order.special_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                    disabled={updatingStatus === order.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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