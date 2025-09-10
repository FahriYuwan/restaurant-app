'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TableCatchAll() {
  const params = useParams()
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Debug: Table Route Catch-All
        </h1>
        <p className="text-slate-700 font-medium mb-4">
          This catch-all route was triggered. URL params: {JSON.stringify(params)}
        </p>
        <Link 
          href="/table/1" 
          className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium inline-block mr-4"
        >
          Go to Table 1
        </Link>
        <Link 
          href="/" 
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block"
        >
          Home
        </Link>
      </div>
    </div>
  )
}