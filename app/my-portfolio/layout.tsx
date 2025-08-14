import MyPortfolioClient from './my-portfolio-client'

export default function MyPortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminEmail = process.env.ADMIN_EMAIL || ""
  
  return <MyPortfolioClient adminEmail={adminEmail} />
}