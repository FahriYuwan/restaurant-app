import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Table Order - Cafe Order',
  description: 'Order from your table using our digital menu',
}

export default function TableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}