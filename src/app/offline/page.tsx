import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className=\"min-h-screen bg-gray-50 flex items-center justify-center p-4\">
      <div className=\"text-center max-w-md mx-auto\">
        <div className=\"inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6\">
          <WifiOff className=\"w-10 h-10 text-red-600\" />
        </div>
        <h1 className=\"text-2xl font-bold text-gray-900 mb-4\">
          You're Offline
        </h1>
        <p className=\"text-gray-600 mb-6\">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className=\"bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2\"
        >
          <RefreshCw className=\"w-5 h-5\" />
          Try Again
        </button>
      </div>
    </div>
  )
}