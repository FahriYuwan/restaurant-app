'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Coffee, 
  BarChart3, 
  QrCode, 
  ShoppingBag, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  X,
  Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)

  useEffect(() => {
    checkUser()
    subscribeToPendingOrders()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error: any) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPendingOrders = async () => {
    // Get initial count
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    setPendingOrders(count || 0)

    // Subscribe to changes
    const subscription = supabase
      .channel('pending_orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: 'status=eq.pending'
        }, 
        () => {
          // Refetch count when orders change
          supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .then(({ count }) => setPendingOrders(count || 0))
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error: any) {
      console.error('Error logging out:', error)
      toast.error('Error logging out')
    }
  }

  const navigation = [
    { 
      name: 'Orders', 
      href: '/admin', 
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : undefined
    },
    { name: 'Menu Management', href: '/admin/menu', icon: Coffee },
    { name: 'QR Codes', href: '/admin/qr-codes', icon: QrCode },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className=\"fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden\"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className=\"flex items-center justify-between h-16 px-6 border-b border-gray-200\">
          <div className=\"flex items-center gap-2\">
            <Coffee className=\"w-8 h-8 text-amber-600\" />
            <span className=\"text-xl font-bold text-gray-900\">Cafe Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className=\"lg:hidden p-2 hover:bg-gray-100 rounded-lg\"
          >
            <X className=\"w-5 h-5\" />
          </button>
        </div>

        <nav className=\"mt-6 px-4\">
          <div className=\"space-y-2\">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className=\"w-5 h-5\" />
                  {item.name}
                  {item.badge && (
                    <span className=\"ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center\">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className=\"absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200\">
          <div className=\"flex items-center gap-3 mb-4\">
            <div className=\"w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center\">
              <span className=\"text-amber-600 font-medium text-sm\">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className=\"flex-1 min-w-0\">
              <p className=\"text-sm font-medium text-gray-900 truncate\">
                {user?.email}
              </p>
              <p className=\"text-xs text-gray-500\">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className=\"w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors\"
          >
            <LogOut className=\"w-4 h-4\" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className=\"lg:pl-64\">
        {/* Top bar */}
        <div className=\"bg-white shadow-sm border-b border-gray-200\">
          <div className=\"flex items-center justify-between h-16 px-6\">
            <button
              onClick={() => setSidebarOpen(true)}
              className=\"lg:hidden p-2 hover:bg-gray-100 rounded-lg\"
            >
              <MenuIcon className=\"w-6 h-6\" />
            </button>
            
            <div className=\"flex items-center gap-4\">
              {pendingOrders > 0 && (
                <Link
                  href=\"/admin\"
                  className=\"flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors\"
                >
                  <Bell className=\"w-4 h-4\" />
                  <span className=\"text-sm font-medium\">{pendingOrders} new orders</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className=\"p-6\">
          {children}
        </main>
      </div>
    </div>
  )
}