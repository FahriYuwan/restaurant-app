'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...')
  const [tableCount, setTableCount] = useState<number>(0)
  const [menuCount, setMenuCount] = useState<number>(0)
  const [tables, setTables] = useState<Array<{
    id: number;
    table_number: number;
    qr_code: string;
    is_active: boolean;
    created_at: string;
  }>>([])  
  const [menus, setMenus] = useState<Array<{
    id: number;
    name: string;
    description: string | null;
    price: number;
    category: string;
    is_available: boolean;
    stock_quantity: number | null;
  }>>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const testConnection = async () => {
      const errorList: string[] = []
      
      try {
        // Test basic connection
        console.log('Testing Supabase connection...')
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        // Test tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('tables')
          .select('*')
        
        if (tablesError) {
          errorList.push(`Tables error: ${tablesError.message}`)
          console.error('Tables error:', tablesError)
        } else {
          setTables(tablesData || [])
          setTableCount(tablesData?.length || 0)
          console.log('Tables data:', tablesData)
        }

        // Test menus
        const { data: menusData, error: menusError } = await supabase
          .from('menus')
          .select('*')
        
        if (menusError) {
          errorList.push(`Menus error: ${menusError.message}`)
          console.error('Menus error:', menusError)
        } else {
          setMenus(menusData || [])
          setMenuCount(menusData?.length || 0)
          console.log('Menus data:', menusData)
        }

        if (errorList.length === 0) {
          setConnectionStatus('Connected successfully!')
        } else {
          setConnectionStatus('Connection has errors')
        }
        
        setErrors(errorList)
        
      } catch (error: unknown) {
        console.error('Connection test failed:', error)
        setConnectionStatus('Connection failed')
        errorList.push(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
        setErrors(errorList)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Database Connection Debug</h1>
        
        <div className="grid gap-6">
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <p className={`text-lg font-medium ${
              connectionStatus.includes('success') ? 'text-green-600' : 
              connectionStatus.includes('error') || connectionStatus.includes('failed') ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {connectionStatus}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Errors</h2>
              <ul className="space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-700 font-medium">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tables Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tables ({tableCount})</h2>
            {tables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-2 text-left">ID</th>
                      <th className="border border-slate-300 px-4 py-2 text-left">Table Number</th>
                      <th className="border border-slate-300 px-4 py-2 text-left">Active</th>
                      <th className="border border-slate-300 px-4 py-2 text-left">QR Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id}>
                        <td className="border border-slate-300 px-4 py-2">{table.id}</td>
                        <td className="border border-slate-300 px-4 py-2">{table.table_number}</td>
                        <td className="border border-slate-300 px-4 py-2">
                          {table.is_active ? '✅' : '❌'}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-sm">
                          {table.qr_code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600">No tables found</p>
            )}
          </div>

          {/* Menus Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Menus ({menuCount})</h2>
            {menus.length > 0 ? (
              <div className="grid gap-4">
                {menus.slice(0, 5).map((menu) => (
                  <div key={menu.id} className="border border-slate-200 rounded p-4">
                    <h3 className="font-semibold">{menu.name}</h3>
                    <p className="text-slate-600">{menu.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>Price: Rp{menu.price?.toLocaleString()}</span>
                      <span>Category: {menu.category}</span>
                      <span>Available: {menu.is_available ? '✅' : '❌'}</span>
                    </div>
                  </div>
                ))}
                {menus.length > 5 && (
                  <p className="text-slate-600">... and {menus.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-slate-600">No menus found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}