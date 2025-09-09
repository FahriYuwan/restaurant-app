'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type Menu = Database['public']['Tables']['menus']['Row']

interface MenuFormData {
  name: string
  description: string
  price: number
  category: string
  stock_quantity: number | null
  is_available: boolean
  image_url: string
}

export default function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock_quantity: null,
    is_available: true,
    image_url: ''
  })

  const categories = ['Kopi', 'Makanan', 'Minuman', 'Snack', 'Dessert']

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      setMenus(data || [])
    } catch (error: any) {
      console.error('Error fetching menus:', error)
      toast.error('Failed to load menus')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      stock_quantity: null,
      is_available: true,
      image_url: ''
    })
    setEditingMenu(null)
    setShowAddForm(false)
  }

  const handleEdit = (menu: Menu) => {
    setFormData({
      name: menu.name,
      description: menu.description || '',
      price: menu.price,
      category: menu.category,
      stock_quantity: menu.stock_quantity,
      is_available: menu.is_available,
      image_url: menu.image_url || ''
    })
    setEditingMenu(menu)
    setShowAddForm(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.category.trim() || formData.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingMenu) {
        // Update existing menu
        const { error } = await supabase
          .from('menus')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            price: formData.price,
            category: formData.category,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available,
            image_url: formData.image_url.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMenu.id)

        if (error) throw error
        toast.success('Menu updated successfully')
      } else {
        // Create new menu
        const { error } = await supabase
          .from('menus')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            price: formData.price,
            category: formData.category,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available,
            image_url: formData.image_url.trim() || null
          })

        if (error) throw error
        toast.success('Menu created successfully')
      }

      resetForm()
      await fetchMenus()
    } catch (error: any) {
      console.error('Error saving menu:', error)
      toast.error('Failed to save menu')
    }
  }

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`Are you sure you want to delete \"${menu.name}\"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menu.id)

      if (error) throw error

      toast.success('Menu deleted successfully')
      await fetchMenus()
    } catch (error: any) {
      console.error('Error deleting menu:', error)
      toast.error('Failed to delete menu')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading menus...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Menu Management</h1>
          <p className=\"text-gray-600\">Manage your cafe menu items</p>
        </div>
        <button
          onClick={handleAdd}
          className=\"bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2\"
        >
          <Plus className=\"w-4 h-4\" />
          Add Menu Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingMenu) && (
        <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6\">
          <div className=\"flex items-center justify-between mb-6\">
            <h2 className=\"text-lg font-semibold text-gray-900\">
              {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <button
              onClick={resetForm}
              className=\"p-2 hover:bg-gray-100 rounded-lg transition-colors\"
            >
              <X className=\"w-5 h-5\" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className=\"space-y-4\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Name *
                </label>
                <input
                  type=\"text\"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                  placeholder=\"Enter menu name\"
                  required
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                  required
                >
                  <option value=\"\">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Price (IDR) *
                </label>
                <input
                  type=\"number\"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                  placeholder=\"Enter price\"
                  min=\"0\"
                  step=\"1000\"
                  required
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Stock Quantity (optional)
                </label>
                <input
                  type=\"number\"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    stock_quantity: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                  placeholder=\"Leave empty for unlimited\"
                  min=\"0\"
                />
              </div>
            </div>

            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                placeholder=\"Enter menu description\"
                rows={3}
              />
            </div>

            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                Image URL (optional)
              </label>
              <input
                type=\"url\"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                placeholder=\"https://example.com/image.jpg\"
              />
            </div>

            <div className=\"flex items-center gap-3\">
              <input
                type=\"checkbox\"
                id=\"is_available\"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className=\"w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500\"
              />
              <label htmlFor=\"is_available\" className=\"text-sm font-medium text-gray-700\">
                Available for customers
              </label>
            </div>

            <div className=\"flex gap-3 pt-4\">
              <button
                type=\"submit\"
                className=\"bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2\"
              >
                <Save className=\"w-4 h-4\" />
                {editingMenu ? 'Update Menu' : 'Create Menu'}
              </button>
              <button
                type=\"button\"
                onClick={resetForm}
                className=\"bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors\"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
        {menus.map((menu) => (
          <div key={menu.id} className=\"bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden\">
            {/* Image */}
            <div className=\"aspect-[4/3] bg-gray-100 relative\">
              {menu.image_url ? (
                <img
                  src={menu.image_url}
                  alt={menu.name}
                  className=\"w-full h-full object-cover\"
                />
              ) : (
                <div className=\"flex items-center justify-center h-full text-gray-400\">
                  <ImageIcon className=\"w-12 h-12\" />
                </div>
              )}
              
              {!menu.is_available && (
                <div className=\"absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center\">
                  <span className=\"text-white font-semibold bg-red-600 px-3 py-1 rounded-full text-sm\">
                    Not Available
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className=\"p-4\">
              <div className=\"flex items-start justify-between mb-2\">
                <div>
                  <h3 className=\"font-semibold text-gray-900\">{menu.name}</h3>
                  <span className=\"inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full\">
                    {menu.category}
                  </span>
                </div>
                <div className=\"flex gap-1\">
                  <button
                    onClick={() => handleEdit(menu)}
                    className=\"p-1 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors\"
                  >
                    <Edit className=\"w-4 h-4\" />
                  </button>
                  <button
                    onClick={() => handleDelete(menu)}
                    className=\"p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors\"
                  >
                    <Trash2 className=\"w-4 h-4\" />
                  </button>
                </div>
              </div>

              {menu.description && (
                <p className=\"text-gray-600 text-sm mb-3 line-clamp-2\">{menu.description}</p>
              )}

              <div className=\"flex items-center justify-between mb-2\">
                <span className=\"text-lg font-bold text-amber-600\">
                  {formatPrice(menu.price)}
                </span>
                {menu.stock_quantity !== null && (
                  <span className=\"text-sm text-gray-500\">
                    Stock: {menu.stock_quantity}
                  </span>
                )}
              </div>

              <div className=\"flex items-center justify-between text-sm\">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  menu.is_available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {menu.is_available ? 'Available' : 'Not Available'}
                </span>
                <span className=\"text-gray-500\">
                  Updated: {new Date(menu.updated_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menus.length === 0 && (
        <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center\">
          <ImageIcon className=\"w-16 h-16 text-gray-300 mx-auto mb-4\" />
          <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No menu items yet</h3>
          <p className=\"text-gray-600 mb-4\">Add your first menu item to get started</p>
          <button
            onClick={handleAdd}
            className=\"bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors\"
          >
            Add Menu Item
          </button>
        </div>
      )}
    </div>
  )
}