import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type PullToRefreshProps = {
  children: React.ReactNode
  onRefresh: () => void | Promise<void>
  className?: string
  threshold?: number
}

/**
 * Pull-to-refresh when the main scroll container is at scrollTop 0 (mobile).
 */
export function PullToRefresh({ children, onRefresh, className, threshold = 72 }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  const distRef = useRef(0)
  const refreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const [dist, setDist] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (el.scrollTop > 2) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
    }

    const onMove = (e: TouchEvent) => {
      if (!pullingRef.current || refreshingRef.current) return
      if (el.scrollTop > 2) {
        distRef.current = 0
        setDist(0)
        return
      }
      const y = e.touches[0].clientY
      const d = Math.max(0, (y - startYRef.current) * 0.45)
      distRef.current = d
      setDist(Math.min(d, 120))
      if (d > 8) e.preventDefault()
    }

    const onEnd = () => {
      if (!pullingRef.current) return
      pullingRef.current = false
      const d = distRef.current
      if (d >= threshold && !refreshingRef.current) {
        refreshingRef.current = true
        setRefreshing(true)
        void Promise.resolve(onRefreshRef.current()).finally(() => {
          refreshingRef.current = false
          setRefreshing(false)
          distRef.current = 0
          setDist(0)
        })
      } else {
        distRef.current = 0
        setDist(0)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [threshold])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y',
        className
      )}
    >
      <div
        className="pointer-events-none flex justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: refreshing ? 44 : dist }}
        aria-hidden
      >
        {dist > 12 || refreshing ? (
          <Loader2
            className={cn(
              'mt-2 h-7 w-7 text-primary',
              refreshing && 'animate-spin',
              !refreshing && dist < threshold && 'opacity-40'
            )}
          />
        ) : null}
      </div>
      <div className="min-h-full text-base leading-relaxed">{children}</div>
    </div>
  )
}
