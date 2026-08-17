import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="auth-card" role="alert">
            <h1 className="auth-title">Something went wrong</h1>
            <p className="auth-sub">
              {this.state.error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button className="primary-btn full-width" onClick={this.handleReset}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
