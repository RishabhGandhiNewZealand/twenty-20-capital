import { Suspense } from 'react'
import MyPortfolioClient from './my-portfolio-client'
import Loading from './loading'

export default function MyPortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminEmail = process.env.ADMIN_EMAIL || ""
  
  return (
    <Suspense fallback={<Loading />}>
      <MyPortfolioClient adminEmail={adminEmail} />
    </Suspense>
  )
}