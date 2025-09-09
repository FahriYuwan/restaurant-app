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
import { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-amber-600" />
            <span className="text-xl font-bold text-slate-900">Cafe Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-amber-600' : 'text-slate-500 group-hover:text-slate-700'
                  }`} />
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info and logout - Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-slate-600 font-medium">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top navigation bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MenuIcon className="w-6 h-6 text-slate-600" />
              </button>
              <h1 className="text-lg font-semibold text-slate-900 truncate lg:hidden">
                Admin Panel
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {pendingOrders > 0 && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">{pendingOrders} new orders</span>
                  <span className="text-sm sm:hidden">{pendingOrders}</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}