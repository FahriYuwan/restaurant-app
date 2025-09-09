'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { CartProvider, useCart } from '@/components/CartContext'
import MenuItem from '@/components/MenuItem'
import Cart from '@/components/Cart'
import toast from 'react-hot-toast'

type Menu = Database['public']['Tables']['menus']['Row']
type Table = Database['public']['Tables']['tables']['Row']

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
  
  const { state } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch table info
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .eq('is_active', true)
          .single()

        if (tableError || !tableData) {
          toast.error('Meja tidak ditemukan')
          router.push('/')
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

        if (menuError) throw menuError

        setMenus(menuData || [])
      } catch (error: any) {
        console.error('Error fetching data:', error)
        toast.error('Terjadi kesalahan saat memuat data')
      } finally {
        setLoading(false)
      }
    }

    if (tableId) {
      fetchData()
    }
  }, [tableId, router])

  const categories = ['Semua', ...Array.from(new Set(menus.map(menu => menu.category)))]

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || menu.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className=\"bg-white shadow-sm sticky top-0 z-40\">
        <div className=\"px-4 py-4\">
          <div className=\"flex items-center justify-between mb-4\">
            <div className=\"flex items-center gap-3\">
              <button
                onClick={() => router.push('/')}
                className=\"p-2 hover:bg-gray-100 rounded-full transition-colors\"
              >
                <ArrowLeft className=\"w-6 h-6\" />
              </button>
              <div>
                <h1 className=\"text-xl font-bold text-gray-900\">
                  Meja {table?.table_number}
                </h1>
                <p className=\"text-sm text-gray-600\">Pilih menu favorit Anda</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsCartOpen(true)}
              className=\"relative p-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors\"
            >
              <ShoppingCart className=\"w-6 h-6\" />
              {state.items.length > 0 && (
                <span className=\"absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold\">
                  {state.items.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className=\"relative mb-4\">
            <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\" />
            <input
              type=\"text\"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=\"Cari menu...\"
              className=\"w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
            />
          </div>

          {/* Categories */}
          <div className=\"flex gap-2 overflow-x-auto pb-2\">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className=\"px-4 py-6\">
        {filteredMenus.length === 0 ? (
          <div className=\"text-center py-12\">
            <div className=\"text-gray-400 mb-4\">
              <Filter className=\"w-16 h-16 mx-auto\" />
            </div>
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">Menu tidak ditemukan</h3>
            <p className=\"text-gray-600\">
              Coba ubah kata kunci pencarian atau filter kategori
            </p>
          </div>
        ) : (
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
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
          className=\"fixed bottom-6 right-6 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-colors z-30 md:hidden\"
        >
          <div className=\"relative\">
            <ShoppingCart className=\"w-6 h-6\" />
            <span className=\"absolute -top-3 -right-3 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold\">
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