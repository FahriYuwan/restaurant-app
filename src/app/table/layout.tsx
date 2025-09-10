import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Table Order - Cafe Order',
  description: 'Order from your table using our digital menu',
}

// Force dynamic rendering for all table routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}