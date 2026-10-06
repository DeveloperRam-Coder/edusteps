import { useApiHealth } from '@/core/hooks/useApiHealth'

export default function ApiStatusBanner() {
  const { ok } = useApiHealth()

  if (ok !== false) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <span className="font-medium">Backend is unreachable. Some actions may fail.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    </div>
  )
}

