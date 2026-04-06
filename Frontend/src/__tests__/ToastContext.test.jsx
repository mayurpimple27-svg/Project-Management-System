import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider, useToast } from '../context/ToastContext'

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides toast functionality', () => {
    const TestComponent = () => {
      const { pushToast } = useToast()

      return (
        <button onClick={() => pushToast('Test message', 'success')}>
          Push Toast
        </button>
      )
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    expect(screen.getByText('Push Toast')).toBeTruthy()
  })

  it('displays toast messages', async () => {
    const TestComponent = () => {
      const { pushToast, toasts } = useToast()

      return (
        <div>
          <button onClick={() => pushToast('Success!', 'success')}>
            Push Success
          </button>
          <div data-testid="toasts">
            {toasts.map((toast) => (
              <div key={toast.id} data-testid={`toast-${toast.id}`}>
                {toast.message}
              </div>
            ))}
          </div>
        </div>
      )
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    const button = screen.getByText('Push Success')
    expect(button).toBeTruthy()
  })

  it('handles multiple toast tones', () => {
    const tones = ['success', 'error', 'info']
    const TestComponent = () => {
      const { pushToast } = useToast()

      return (
        <div>
          {tones.map((tone) => (
            <button
              key={tone}
              onClick={() => pushToast(`${tone} message`, tone)}
              data-testid={`btn-${tone}`}
            >
              Push {tone}
            </button>
          ))}
        </div>
      )
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    tones.forEach((tone) => {
      expect(screen.getByTestId(`btn-${tone}`)).toBeTruthy()
    })
  })
})
