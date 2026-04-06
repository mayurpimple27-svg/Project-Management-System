import { useToast } from '../context/ToastContext'

const toneStyles = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-rose-300 bg-rose-50 text-rose-900',
  info: 'border-slate-300 bg-white text-slate-900',
}

export const ToastViewport = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 grid w-[min(360px,90vw)] gap-2">
      {toasts.map((toast) => (
        <button
          className={`pointer-events-auto rounded-xl border px-3 py-2 text-left text-sm shadow-lg backdrop-blur transition hover:translate-y-[-1px] ${toneStyles[toast.tone] || toneStyles.info}`}
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          type="button"
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
