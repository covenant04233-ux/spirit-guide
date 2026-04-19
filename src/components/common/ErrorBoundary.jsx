import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    const { fallback, children } = this.props

    if (error) {
      return typeof fallback === 'function' ? fallback({ error }) : fallback
    }

    return children
  }
}

