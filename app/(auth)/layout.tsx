import { ErrorBoundary } from '@/components/ErrorBoundary'

// Prevent static generation for auth routes
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
