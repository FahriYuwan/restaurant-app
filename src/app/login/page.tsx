'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Coffee, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast.success('Login berhasil!')
        router.push('/admin')
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4\">
      <div className=\"bg-white rounded-2xl shadow-xl p-8 w-full max-w-md\">
        <div className=\"text-center mb-8\">
          <div className=\"inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4\">
            <Coffee className=\"w-8 h-8 text-amber-600\" />
          </div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Admin Login</h1>
          <p className=\"text-gray-600 mt-2\">Masuk ke dashboard barista</p>
        </div>

        <form onSubmit={handleLogin} className=\"space-y-6\">
          <div>
            <label htmlFor=\"email\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Email
            </label>
            <div className=\"relative\">
              <Mail className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\" />
              <input
                id=\"email\"
                type=\"email\"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=\"w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                placeholder=\"admin@cafe.com\"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor=\"password\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Password
            </label>
            <div className=\"relative\">
              <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\" />
              <input
                id=\"password\"
                type=\"password\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=\"w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent\"
                placeholder=\"••••••••\"
                required
              />
            </div>
          </div>

          <button
            type=\"submit\"
            disabled={loading}
            className=\"w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors\"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className=\"mt-6 text-center\">
          <p className=\"text-sm text-gray-600\">
            Demo credentials: admin@cafe.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}