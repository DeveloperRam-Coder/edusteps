import { useEffect, useRef, useState } from 'react'
import api, { API_BASE_URL } from '@/core/api/client'

type ApiHealthState = {
  ok: boolean | null
  error?: string
}

export function useApiHealth(): ApiHealthState {
  const [state, setState] = useState<ApiHealthState>({ ok: null })
  const prevOk = useRef<boolean | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      let nextOk: boolean
      let nextError: string | undefined

      try {
        await api.get('/health', { timeout: 6000 })
        nextOk = true
      } catch (e: any) {
        const status = e?.response?.status
        nextOk = status === 401 // 401 means server is up, just needs auth
        if (!nextOk) {
          nextError = e?.message || `Cannot reach API at ${API_BASE_URL}`
        }
      }

      if (cancelled) return

      // Only update state when value actually changes
      if (nextOk !== prevOk.current) {
        prevOk.current = nextOk
        setState({ ok: nextOk, error: nextError })
      }

      if (nextOk) {
        // API is healthy — stop polling, no need to keep hitting the server
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // API is down — start polling every 15s to detect recovery
        if (!intervalRef.current) {
          intervalRef.current = setInterval(check, 15000)
        }
      }
    }

    check()

    return () => {
      cancelled = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return state
}
