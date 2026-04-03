import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 text-center p-8">
          <p className="text-2xl font-bold text-destructive">Something went wrong</p>
          <p className="text-sm text-muted-foreground font-mono max-w-lg break-all">
            {this.state.error.message}
          </p>
          <button
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
