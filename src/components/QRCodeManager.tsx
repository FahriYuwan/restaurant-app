'use client'

import { useState, useEffect } from 'react'
import { Download, QrCode, Printer, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { insertTable, updateTable } from '@/lib/supabase-helpers'
import { generateTableQRCode, generateTableQRCodeSVG } from '@/lib/qr-generator'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type Table = Database['public']['Tables']['tables']['Row']

interface TableInsertData {
  table_number: number;
  qr_code: string;
  is_active?: boolean;
}

export default function QRCodeManager() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingQR, setGeneratingQR] = useState<number | null>(null)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [regeneratingAll, setRegeneratingAll] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')

      if (error) throw error
      setTables(data || [])
    } catch (error: unknown) {
      console.error('Error fetching tables:', error)
      toast.error('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const createTable = async () => {
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number')
      return
    }

    const tableNumber = parseInt(newTableNumber)
    if (isNaN(tableNumber) || tableNumber <= 0) {
      toast.error('Please enter a valid table number')
      return
    }

    try {
      // Use production URL for QR codes
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     `https://${process.env.VERCEL_URL}` || 
                     'http://localhost:3001'
      
      console.log('Creating QR code with base URL:', baseUrl)
      
      const qrCode = `table_${tableNumber}_${Date.now()}`

      const insertPayload: TableInsertData = {
        table_number: tableNumber,
        qr_code: qrCode,
        is_active: true
      }
      const { data, error } = await insertTable(insertPayload)

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('Table number already exists')
        } else {
          throw error
        }
        return
      }

      setTables([...tables, data])
      setNewTableNumber('')
      toast.success(`Table ${tableNumber} created successfully`)
    } catch (error: unknown) {
      console.error('Error creating table:', error)
      toast.error('Failed to create table')
    }
  }

  const deleteTable = async (tableId: number) => {
    if (!confirm('Are you sure you want to delete this table?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error

      setTables(tables.filter(table => table.id !== tableId))
      toast.success('Table deleted successfully')
    } catch (error: unknown) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table')
    }
  }

  const regenerateAllQRCodes = async () => {
    if (!confirm('This will regenerate QR codes for all tables with the current production URL. Continue?')) {
      return
    }

    setRegeneratingAll(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     `https://${process.env.VERCEL_URL}` || 
                     'http://localhost:3001'
      
      console.log('Regenerating all QR codes with base URL:', baseUrl)
      
      let successCount = 0
      
      for (const table of tables) {
        try {
          const newQrCode = `table_${table.table_number}_${Date.now()}`
          
          const { error } = await updateTable(table.id, {
            qr_code: newQrCode
          })
          
          if (error) {
            console.error(`Error updating table ${table.table_number}:`, error)
          } else {
            successCount++
          }
        } catch (error) {
          console.error(`Error processing table ${table.table_number}:`, error)
        }
      }
      
      if (successCount === tables.length) {
        toast.success(`Successfully regenerated ${successCount} QR codes`)
      } else {
        toast.success(`Regenerated ${successCount}/${tables.length} QR codes`)
      }
      
      // Refresh the table list
      await fetchTables()
      
    } catch (error) {
      console.error('Error regenerating QR codes:', error)
      toast.error('Failed to regenerate QR codes')
    } finally {
      setRegeneratingAll(false)
    }
  }

  const downloadQRCode = async (table: Table) => {
    setGeneratingQR(table.id)
    try {
      const qrCodeDataUrl = await generateTableQRCode(table.table_number)
      
      // Create download link
      const link = document.createElement('a')
      link.href = qrCodeDataUrl
      link.download = `qr-table-${table.table_number}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('QR Code downloaded')
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    } finally {
      setGeneratingQR(null)
    }
  }

  const printQRCode = async (table: Table) => {
    setGeneratingQR(table.id)
    try {
      const qrCodeSVG = await generateTableQRCodeSVG(table.table_number)
      
      // Create print window with styled content
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to print QR codes')
        return
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - Table ${table.table_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #8B4513;
              border-radius: 15px;
              padding: 30px;
              margin: 20px auto;
              max-width: 400px;
              background: white;
            }
            .table-number {
              font-size: 24px;
              font-weight: bold;
              color: #8B4513;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .instructions {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
              line-height: 1.4;
            }
            .cafe-name {
              font-size: 28px;
              font-weight: bold;
              color: #8B4513;
              margin-bottom: 10px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="cafe-name">Cafe Order</div>
            <div class="table-number">MEJA ${table.table_number}</div>
            <div class="qr-code">${qrCodeSVG}</div>
            <div class="instructions">
              <strong>Cara Memesan:</strong><br>
              1. Scan QR code dengan kamera HP<br>
              2. Pilih menu favorit Anda<br>
              3. Checkout dan bayar di kasir<br>
              <br>
              <em>Selamat menikmati!</em>
            </div>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
      
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
      
      toast.success('QR Code sent to printer')
    } catch (error) {
      console.error('Error printing QR code:', error)
      toast.error('Failed to print QR code')
    } finally {
      setGeneratingQR(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">QR Code Management</h2>
          <p className="text-slate-700 font-medium">Generate and manage QR codes for tables</p>
        </div>
        
        {tables.length > 0 && (
          <button
            onClick={regenerateAllQRCodes}
            disabled={regeneratingAll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            <QrCode className="w-4 h-4" />
            {regeneratingAll ? 'Regenerating...' : 'Regenerate All QR Codes'}
          </button>
        )}
      </div>

      {/* Add New Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Table</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            placeholder="Table number"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
            min="1"
          />
          <button
            onClick={createTable}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Table</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <QrCode className="w-6 h-6 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">Table {table.table_number}</h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {table.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteTable(table.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete table"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => downloadQRCode(table)}
                disabled={generatingQR === table.id}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
              >
                <Download className="w-4 h-4" />
                {generatingQR === table.id ? 'Generating...' : 'Download QR'}
              </button>
              
              <button
                onClick={() => printQRCode(table)}
                disabled={generatingQR === table.id}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
              >
                <Printer className="w-4 h-4" />
                {generatingQR === table.id ? 'Generating...' : 'Print QR'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 font-medium break-all">
                URL: /table/{table.table_number}
              </p>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <QrCode className="w-12 md:w-16 h-12 md:h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tables yet</h3>
          <p className="text-slate-600 font-medium">Create your first table to generate QR codes</p>
        </div>
      )}
    </div>
  )
}