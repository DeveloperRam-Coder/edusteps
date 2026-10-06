import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Sun, Moon, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import NotificationCenter from '@/components/NotificationCenter/NotificationCenter'

type MobileMoreDrawerProps = {
  open: boolean
  onClose: () => void
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  isDark: boolean
  onToggleTheme: () => void
  userName?: string | null
  userEmail?: string | null
  userAvatar?: string | null
  onProfile: () => void
  onLogout: () => Promise<void>
}

/** Slide-over from the right: search, theme, notifications, profile shortcut, logout. */
export function MobileMoreDrawer({
  open,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  isDark,
  onToggleTheme,
  userName,
  userEmail,
  userAvatar,
  onProfile,
  onLogout,
}: MobileMoreDrawerProps) {
  const touchStartX = React.useRef(0)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    if (endX - touchStartX.current > 80) onClose()
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleLogout = useCallback(async () => {
    onClose()
    await onLogout()
  }, [onClose, onLogout])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="More menu"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          'fixed right-0 top-0 z-[61] flex h-full w-[min(100vw-1rem,20rem)] flex-col border-l border-gray-200 bg-white pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 lg:hidden',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        )}
      >
        <div className="flex h-14 min-h-[44px] shrink-0 items-center justify-end border-b border-gray-200 px-2 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-600 touch-manipulation hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain px-3 py-4">
          <form onSubmit={onSearchSubmit} className="mb-6">
            <label htmlFor="mobile-drawer-search" className="sr-only">
              Search students
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  id="mobile-drawer-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  title="Search by name or mobile"
                  placeholder=""
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  enterKeyHint="search"
                />
              </div>
              <button
                type="submit"
                title="Search"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground touch-manipulation"
                aria-label="Run search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? 'Use light theme' : 'Use dark theme'}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center self-start rounded-xl bg-gray-100 touch-manipulation hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-slate-600" />}
            </button>
            <div title="Notifications" className="inline-flex min-h-[48px] items-center">
              <NotificationCenter />
            </div>
            <button
              type="button"
              onClick={() => {
                onClose()
                onProfile()
              }}
              title="Account & settings"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center self-start rounded-xl bg-gray-100 touch-manipulation hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label="Settings and profile"
            >
              <Settings className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          {(userName || userEmail) && (
            <div
              className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
              title={userEmail ? `${userName || ''} ${userEmail}` : userName || ''}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 overflow-hidden items-center justify-center rounded-full bg-primary">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName || 'Avatar'}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary-foreground">
                      {userName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{userName || 'User'}</p>
                  {userEmail && <p className="truncate text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Sign out"
            className="mt-6 inline-flex min-h-[48px] min-w-[48px] items-center justify-center self-center rounded-xl border border-red-200 bg-red-50 text-red-700 touch-manipulation hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            aria-label="Log out"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </aside>
    </>,
    document.body
  )
}
