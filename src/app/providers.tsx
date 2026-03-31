import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/ui/sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
