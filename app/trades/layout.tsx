import { Suspense } from 'react'
import TradesLoading from './loading'

export default function TradesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<TradesLoading />}>
      {children}
    </Suspense>
  )
}