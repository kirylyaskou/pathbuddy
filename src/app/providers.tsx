import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/ui/sonner'
import { UpdateDialog } from '@/widgets/update-dialog'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster />
      <UpdateDialog />
    </ThemeProvider>
  )
}
