'use client'

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Search, Filter, Clock, Coffee, Utensils, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { CartProvider, useCart } from '@/components/CartContext'
import MenuItem from '@/components/MenuItem'
import Cart from '@/components/Cart'
import toast from 'react-hot-toast'

type Menu = Database['public']['Tables']['menus']['Row']
type Table = Database['public']['Tables']['tables']['Row']
type Order = Database['public']['Tables']['orders']['Row']

function TableOrderingContent() {
  const params = useParams()
  const router = useRouter()
  const tableId = parseInt(params.tableId as string)
  
  const [table, setTable] = useState<Table | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [orderSubscriptions, setOrderSubscriptions] = useState<Record<number, ReturnType<typeof supabase.channel> | null>>({})
  
  const { state } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for table ID:', tableId)
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        // Fetch table info
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .eq('is_active', true)
          .single()

        console.log('Table query result:', { tableData, tableError })

        if (tableError || !tableData) {
          console.error('Table not found or error:', tableError)
          toast.error('Meja tidak ditemukan atau database tidak terhubung')
          // Don't redirect immediately, let user see the error
          return
        }

        setTable(tableData)

        // Fetch available menus
        const { data: menuData, error: menuError } = await supabase
          .from('menus')
          .select('*')
          .eq('is_available', true)
          .order('category')
          .order('name')

        console.log('Menu query result:', { menuData, menuError })

        if (menuError) {
          console.error('Menu fetch error:', menuError)
          toast.error('Gagal memuat menu: ' + menuError.message)
          return
        }

        setMenus(menuData || [])
        
        if (!menuData || menuData.length === 0) {
          toast.error('Tidak ada menu yang tersedia')
        }
      } catch (error: unknown) {
        console.error('Error fetching data:', error)
        toast.error('Terjadi kesalahan saat memuat data')
      } finally {
        setLoading(false)
      }
    }

    const init = async () => {
      if (tableId) {
        await fetchData()
        await fetchActiveOrders()
      }
    }

    init()

    // Refresh data when user comes back to this page (for stock updates)
    const handleVisibilityChange = () => {
      if (!document.hidden && tableId) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      Object.values(orderSubscriptions).forEach(subscription => {
        if (subscription) {
          subscription.unsubscribe()
        }
      })
    }
  }, [tableId, router, orderSubscriptions])

  // Fetch all active orders for this table
  const fetchActiveOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', tableId)
        .neq('status', 'delivered')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (!error && ordersData) {
        setActiveOrders(ordersData as Order[])
        // Subscribe to updates for all active orders
        ordersData.forEach((order: Order) => {
          subscribeToOrderUpdates(order.id)
        })
      } else {
        setActiveOrders([])
      }
    } catch (error) {
      console.error('Error fetching active orders:', error)
    }
  }

  // Subscribe to order updates
  const subscribeToOrderUpdates = (orderId: number) => {
    // Check if already subscribed to this order
    if (orderSubscriptions[orderId]) {
      return
    }

    const subscription = supabase
      .channel(`order_status_updates_${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, 
        (payload) => {
          // Update the specific order in our state
          setActiveOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? {...order, ...payload.new} as Order : order
            )
          )
          
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
              // Remove the order from active orders after delivery
              setTimeout(() => {
                setActiveOrders(prevOrders => prevOrders.filter(order => order.id !== orderId))
              }, 5000)
              break
            case 'cancelled':
              toast.error('Pesanan dibatalkan')
              // Remove the order from active orders after cancellation
              setTimeout(() => {
                setActiveOrders(prevOrders => prevOrders.filter(order => order.id !== orderId))
              }, 5000)
              break
          }
        }
      )
      .subscribe()

    // Update subscriptions record
    setOrderSubscriptions(prev => ({
      ...prev,
      [orderId]: subscription
    }))
  }

  const categories = ['Semua', ...Array.from(new Set(menus.map(menu => menu.category)))]

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || menu.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Function to get status information for display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Menunggu Konfirmasi',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        }
      case 'preparing':
        return {
          text: 'Sedang Diproses',
          icon: Coffee,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      case 'ready':
        return {
          text: 'Siap Disajikan',
          icon: Utensils,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'delivered':
        return {
          text: 'Selesai',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'cancelled':
        return {
          text: 'Dibatalkan',
          icon: Clock,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      default:
        return {
          text: 'Status Tidak Diketahui',
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Memuat menu...</p>
          <p className="text-slate-500 text-sm mt-2">Menghubungkan ke database...</p>
        </div>
      </div>
    )
  }

  // Show error state if no table found
  if (!loading && !table) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Meja Tidak Ditemukan</h2>
          <p className="text-slate-700 font-medium mb-6">
            Meja dengan nomor {tableId} tidak tersedia atau sedang tidak aktif.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Order Status Indicators - Show all active orders */}
      {activeOrders.length > 0 && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-3 space-y-2">
            {activeOrders.map(order => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon
              return (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                      <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Pesanan #{order.id}
                      </p>
                      <p className="text-xs text-slate-600">{statusInfo.text}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/table/${tableId}/order/${order.id}`)}
                    className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200"
              >
                <ArrowLeft className="w-6 h-6 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Meja {table?.table_number}
                </h1>
                <p className="text-sm text-slate-700 font-medium">Pilih menu favorit Anda</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {state.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {state.items.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 py-6">
        {filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {menus.length === 0 ? (
                <>
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Menu Belum Tersedia</h3>
                  <p className="text-slate-700 font-medium mb-4">
                    Sepertinya menu belum diatur atau database tidak terhubung.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Muat Ulang
                  </button>
                </>
              ) : (
                <>
                  <Filter className="w-16 h-16 mx-auto" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Menu tidak ditemukan</h3>
                  <p className="text-slate-700 font-medium">
                    Coba ubah kata kunci pencarian atau filter kategori
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenus.map((menu) => (
              <MenuItem key={menu.id} menu={menu} />
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <Cart 
        tableId={tableId}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Floating Cart Button for Mobile */}
      {state.items.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-colors z-30 md:hidden"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
              {state.items.length}
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

export default function TableOrderingPage() {
  return (
    <CartProvider>
      <TableOrderingContent />
    </CartProvider>
  )
}