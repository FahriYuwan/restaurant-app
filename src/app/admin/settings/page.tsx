'use client'

import { useState, useEffect } from 'react'
import { Save, Bell, Coffee, Settings as SettingsIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    cafeName: 'Cafe Order',
    cafeDescription: 'Nikmati pengalaman pemesanan digital yang mudah dan cepat',
    enableNotifications: true,
    autoRefreshInterval: 30, // seconds
    maxOrdersPerTable: 10,
    defaultCategory: 'Kopi'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Load from localStorage for now (could be moved to database)
    const savedSettings = localStorage.getItem('cafe-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...settings, ...parsed })
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save to localStorage (could be moved to database)
      localStorage.setItem('cafe-settings', JSON.stringify(settings))
      
      toast.success('Settings saved successfully')
    } catch (error: unknown) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        cafeName: 'Cafe Order',
        cafeDescription: 'Nikmati pengalaman pemesanan digital yang mudah dan cepat',
        enableNotifications: true,
        autoRefreshInterval: 30,
        maxOrdersPerTable: 10,
        defaultCategory: 'Kopi'
      })
      toast.success('Settings reset to default')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-700 font-medium">Configure your cafe application settings</p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="space-y-6">
          {/* Cafe Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Cafe Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Cafe Name
                </label>
                <input
                  type="text"
                  value={settings.cafeName}
                  onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                  placeholder="Enter cafe name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Default Category
                </label>
                <select
                  value={settings.defaultCategory}
                  onChange={(e) => setSettings({ ...settings, defaultCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
                >
                  <option value="Kopi">Kopi</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Snack">Snack</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Cafe Description
              </label>
              <textarea
                value={settings.cafeDescription}
                onChange={(e) => setSettings({ ...settings, cafeDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                rows={3}
                placeholder="Enter cafe description"
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="enableNotifications" className="text-sm font-medium text-slate-700">
                  Enable sound notifications for new orders
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Auto Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  value={settings.autoRefreshInterval}
                  onChange={(e) => setSettings({ ...settings, autoRefreshInterval: parseInt(e.target.value) || 30 })}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
                  min="10"
                  max="300"
                />
                <p className="text-xs text-slate-600 font-medium mt-1">
                  How often the dashboard should check for new orders (10-300 seconds)
                </p>
              </div>
            </div>
          </div>

          {/* Order Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Order Settings</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Maximum Orders Per Table
              </label>
              <input
                type="number"
                value={settings.maxOrdersPerTable}
                onChange={(e) => setSettings({ ...settings, maxOrdersPerTable: parseInt(e.target.value) || 10 })}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
                min="1"
                max="50"
              />
              <p className="text-xs text-slate-600 font-medium mt-1">
                Maximum number of active orders per table (1-50)
              </p>
            </div>
          </div>

          {/* App Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Application Information</h2>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Version:</span>
                <span className="font-mono text-slate-900">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Build:</span>
                <span className="font-mono text-slate-900">Next.js 15.5.2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Database:</span>
                <span className="font-mono text-slate-900">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Last Updated:</span>
                <span className="font-mono text-slate-900">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={resetSettings}
            className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  )
}