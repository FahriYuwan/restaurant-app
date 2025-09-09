import Link from 'next/link'
import { Coffee, QrCode, Smartphone } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <Coffee className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Cafe Order
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 font-medium mb-8">
              Pesan langsung dari meja Anda dengan QR code
            </p>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              Nikmati pengalaman pemesanan yang cepat dan mudah tanpa harus memanggil pelayan. 
              Cukup scan QR code di meja Anda dan mulai memesan!
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <QrCode className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Scan QR Code</h3>
              <p className="text-slate-700 font-medium">
                Scan QR code unik di setiap meja untuk mengakses menu digital kami
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Smartphone className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Pesan Langsung</h3>
              <p className="text-slate-700 font-medium">
                Pilih menu favorit Anda dan berikan catatan khusus jika diperlukan
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Coffee className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Tracking Status</h3>
              <p className="text-slate-700 font-medium">
                Pantau status pesanan Anda secara realtime hingga siap disajikan
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/table/1" 
              className="bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Demo - Meja 1
            </Link>
            <Link 
              href="/admin" 
              className="border-2 border-amber-600 text-amber-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-amber-600 hover:text-white transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>

          {/* Instructions */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg text-left max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">Cara Menggunakan</h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Duduk di meja</h4>
                  <p className="text-slate-700 font-medium">Pilih meja yang tersedia di cafe kami</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Scan QR Code</h4>
                  <p className="text-slate-700 font-medium">Gunakan kamera HP untuk scan QR code di meja</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Pilih Menu</h4>
                  <p className="text-slate-700 font-medium">Browse menu dan tambahkan item ke keranjang</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                  4
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Checkout & Bayar</h4>
                  <p className="text-slate-700 font-medium">Konfirmasi pesanan dan bayar di kasir</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
