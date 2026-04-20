import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/ui/sonner'
import { UpdateDialog } from '@/widgets/update-dialog'
import { useStartupUpdateCheck } from './useStartupUpdateCheck'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useStartupUpdateCheck()
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster />
      <UpdateDialog />
    </ThemeProvider>
  )
}
