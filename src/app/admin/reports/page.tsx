'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, TrendingUp, Coffee, DollarSign, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  menus: Database['public']['Tables']['menus']['Row']
}

interface DailyStats {
  date: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
}

interface PopularItem {
  name: string
  category: string
  totalQuantity: number
  totalRevenue: number
}

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [selectedDate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 1)

      // Fetch orders for the selected date
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .neq('status', 'cancelled')

      if (ordersError) throw ordersError

      // Calculate daily stats
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setDailyStats({
        date: selectedDate,
        totalOrders,
        totalRevenue,
        averageOrderValue
      })

      // Fetch order items with menu details for popular items
      const orderIds = orders.map(order => order.id)
      if (orderIds.length > 0) {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menus (*)
          `)
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        // Group items by menu and calculate stats
        const itemStats: { [key: string]: PopularItem } = {}
        
        orderItems.forEach((item: OrderItem) => {
          const menuName = item.menus.name
          if (!itemStats[menuName]) {
            itemStats[menuName] = {
              name: menuName,
              category: item.menus.category,
              totalQuantity: 0,
              totalRevenue: 0
            }
          }
          itemStats[menuName].totalQuantity += item.quantity
          itemStats[menuName].totalRevenue += item.price * item.quantity
        })

        // Sort by quantity and take top 10
        const popularItemsList = Object.values(itemStats)
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 10)

        setPopularItems(popularItemsList)
      } else {
        setPopularItems([])
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const downloadReport = () => {
    if (!dailyStats) return

    const reportData = {
      date: dailyStats.date,
      summary: {
        totalOrders: dailyStats.totalOrders,
        totalRevenue: dailyStats.totalRevenue,
        averageOrderValue: dailyStats.averageOrderValue
      },
      popularItems: popularItems
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `cafe-report-${selectedDate}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded')
  }

  if (loading) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Sales Reports</h1>
          <p className=\"text-gray-600\">View daily sales performance and popular items</p>
        </div>
        <div className=\"flex items-center gap-3\">
          <input
            type=\"date\"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className=\"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
          />
          <button
            onClick={downloadReport}
            className=\"bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2\"
          >
            <Download className=\"w-4 h-4\" />
            Download
          </button>
        </div>
      </div>

      {/* Daily Stats Cards */}
      {dailyStats && (
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
          <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
            <div className=\"flex items-center gap-3\">
              <div className=\"p-3 bg-blue-100 rounded-lg\">
                <Coffee className=\"w-6 h-6 text-blue-600\" />
              </div>
              <div>
                <p className=\"text-2xl font-bold text-gray-900\">{dailyStats.totalOrders}</p>
                <p className=\"text-sm text-gray-600\">Total Orders</p>
              </div>
            </div>
          </div>

          <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
            <div className=\"flex items-center gap-3\">
              <div className=\"p-3 bg-green-100 rounded-lg\">
                <DollarSign className=\"w-6 h-6 text-green-600\" />
              </div>
              <div>
                <p className=\"text-2xl font-bold text-gray-900\">
                  {formatPrice(dailyStats.totalRevenue)}
                </p>
                <p className=\"text-sm text-gray-600\">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
            <div className=\"flex items-center gap-3\">
              <div className=\"p-3 bg-amber-100 rounded-lg\">
                <TrendingUp className=\"w-6 h-6 text-amber-600\" />
              </div>
              <div>
                <p className=\"text-2xl font-bold text-gray-900\">
                  {formatPrice(dailyStats.averageOrderValue)}
                </p>
                <p className=\"text-sm text-gray-600\">Average Order Value</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Items */}
      <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-6\">Popular Items</h2>
        
        {popularItems.length === 0 ? (
          <div className=\"text-center py-8\">
            <Coffee className=\"w-12 h-12 text-gray-300 mx-auto mb-3\" />
            <p className=\"text-gray-600\">No orders found for this date</p>
          </div>
        ) : (
          <div className=\"space-y-4\">
            {popularItems.map((item, index) => (
              <div key={item.name} className=\"flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0\">
                <div className=\"flex items-center gap-4\">
                  <div className=\"w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center\">
                    <span className=\"text-amber-600 font-semibold text-sm\">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className=\"font-medium text-gray-900\">{item.name}</h3>
                    <p className=\"text-sm text-gray-600\">{item.category}</p>
                  </div>
                </div>
                <div className=\"text-right\">
                  <p className=\"font-semibold text-gray-900\">{item.totalQuantity} sold</p>
                  <p className=\"text-sm text-amber-600\">{formatPrice(item.totalRevenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Insights */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Category Breakdown</h3>
          {popularItems.length === 0 ? (
            <p className=\"text-gray-600\">No data available</p>
          ) : (
            <div className=\"space-y-3\">
              {Object.entries(
                popularItems.reduce((acc, item) => {
                  acc[item.category] = (acc[item.category] || 0) + item.totalQuantity
                  return acc
                }, {} as { [key: string]: number })
              ).map(([category, quantity]) => (
                <div key={category} className=\"flex justify-between items-center\">
                  <span className=\"text-gray-700\">{category}</span>
                  <span className=\"font-semibold text-gray-900\">{quantity} items</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Quick Stats</h3>
          {dailyStats && (
            <div className=\"space-y-3\">
              <div className=\"flex justify-between items-center\">
                <span className=\"text-gray-700\">Date</span>
                <span className=\"font-semibold text-gray-900\">
                  {new Date(dailyStats.date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className=\"flex justify-between items-center\">
                <span className=\"text-gray-700\">Total Items Sold</span>
                <span className=\"font-semibold text-gray-900\">
                  {popularItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
                </span>
              </div>
              <div className=\"flex justify-between items-center\">
                <span className=\"text-gray-700\">Best Selling Item</span>
                <span className=\"font-semibold text-gray-900\">
                  {popularItems.length > 0 ? popularItems[0].name : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}