import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { cn } from "@/lib/utils"
import {
  Users,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  CreditCard,
  Sun,
  Moon,
  Search,
  ChevronRight,
  ChevronDown,
  ClipboardCheck,
  BookOpen,
  SlidersHorizontal,
  UserCircle,
  Plus,
} from "lucide-react"
import logo from "@/assets/images/internsteps_logo.png"
import NotificationCenter from "@/components/NotificationCenter/NotificationCenter"
import { useTheme } from "@/core/theme/ThemeContext"
import { PullToRefresh } from "@/core/components/PullToRefresh"
import { MobileMoreDrawer } from "@/core/layouts/MobileMoreDrawer"
import { useActivityContext } from "@/core/components/ActivityContext"
import { resolveApiAssetUrl } from "@/core/api/client"

type MenuItem = {
  icon: typeof LayoutDashboard
  label: string
  path: string
}

const PRIMARY_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
  { icon: CreditCard, label: "Payments", path: "/payment-details" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
]

const ACCOUNT_MENU: MenuItem[] = [
  { icon: SlidersHorizontal, label: "Settings", path: "/settings" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
]

function getBreadcrumb(pathname: string): { label: string; path?: string }[] {
  if (pathname.startsWith("/customers/") && pathname !== "/customers")
    return [{ label: "Customers", path: "/customers" }, { label: "Detail" }]
  if (pathname.startsWith("/dashboard")) return [{ label: "Dashboard" }]
  if (pathname.startsWith("/customers")) return [{ label: "Customers" }]
  if (pathname.startsWith("/attendance")) return [{ label: "Attendance" }]
  if (pathname.startsWith("/payment-details")) return [{ label: "Payments" }]
  if (pathname.startsWith("/courses")) return [{ label: "Courses" }]
  if (pathname.startsWith("/settings")) return [{ label: "Settings" }]
  if (pathname.startsWith("/profile")) return [{ label: "Settings" }, { label: "Profile" }]
  return [{ label: "InternSteps" }]
}

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, businessDetails, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [outletKey, setOutletKey] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)

  const { unreadCount: activityUnreadCount } = useActivityContext()
  const isDark = theme === 'dark'
  const breadcrumb = useMemo(() => getBreadcrumb(location.pathname), [location.pathname])
  const mobileTitle = useMemo(() => breadcrumb[breadcrumb.length - 1]?.label ?? 'InternSteps', [breadcrumb])
  const businessName = businessDetails?.name || 'InternSteps'

  const isActive = (path: string) => {
    if (path === "/customers") return location.pathname === "/customers" || location.pathname.startsWith("/customers/")
    return location.pathname.startsWith(path)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/customers?search=${encodeURIComponent(q)}`)
      setSearchQuery('')
      setSearchOpen(false)
      setDrawerOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch {
      navigate("/login")
    }
  }

  const [accountOpen, setAccountOpen] = useState(() =>
    ['/settings', '/profile'].some((p) => location.pathname.startsWith(p))
  )
  const profileRef = useRef<HTMLDivElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const onPullRefresh = useCallback(() => {
    setOutletKey((k) => k + 1)
  }, [])

  const quickActions = [
    { label: 'Add Student', path: '/add-customer', icon: Users },
    { label: 'Record Payment', path: '/payment-details', icon: CreditCard },
    { label: 'Manage Courses', path: '/courses', icon: BookOpen },
    { label: 'Take Attendance', path: '/attendance', icon: ClipboardCheck },
  ]

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col bg-background text-base leading-normal text-foreground antialiased lg:flex-row lg:p-3 lg:gap-3">
      {/* Dynamic Background Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft-lg backdrop-blur-xl lg:flex">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-muted">
            <img src={logo} alt="" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-xs font-bold tracking-tight text-foreground truncate" title={businessName}>{businessName}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Main navigation">
          {PRIMARY_MENU.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors duration-150 touch-manipulation",
                  active
                    ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </button>
            )
          })}

          {/* ✅ Account / User Settings nested group */}
          <div className="mt-0.5">
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              className={cn(
                "relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors duration-150",
                ACCOUNT_MENU.some((m) => isActive(m.path))
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-expanded={accountOpen}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="flex-1 text-left">Account</span>
              <ChevronDown
                className={cn("h-3 w-3 transition-transform duration-200", accountOpen && "rotate-180")}
                aria-hidden
              />
            </button>

            {accountOpen && (
              <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2.5">
                {ACCOUNT_MENU.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs font-medium transition-colors duration-150",
                        active
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3 w-3 shrink-0" aria-hidden />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="shrink-0 border-t border-border p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900/60 dark:hover:bg-red-950/25 dark:hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card/40 lg:shadow-soft-lg lg:backdrop-blur-md">
        <header className="sticky top-0 z-40 shrink-0 border-b border-border/40 bg-card/60 backdrop-blur-2xl pt-[env(safe-area-inset-top)]">
          <div className="flex h-12 items-center gap-2.5 px-3 lg:px-5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" aria-hidden />
            </button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-1.5 lg:flex">
                <span className="text-xs font-medium text-muted-foreground">
                  Hello, {user?.name?.split(' ')[0] || 'User'} 👋
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                {breadcrumb.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                    {crumb.path ? (
                      <button
                        type="button"
                        onClick={() => navigate(crumb.path!)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-foreground">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="truncate text-sm font-semibold text-foreground lg:hidden">{mobileTitle}</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <form onSubmit={handleSearch} className="relative hidden lg:flex">
                <div className={cn(
                  "flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 transition-all duration-200",
                  searchOpen ? "w-52 border-primary/40 bg-card" : "w-8 cursor-pointer hover:border-border/80"
                )}>
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  {searchOpen ? (
                    <input
                      autoFocus type="search" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students…"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground"
                      aria-label="Search students"
                      onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="absolute inset-0 h-full w-full"
                      aria-label="Open search"
                    />
                  )}
                </div>
              </form>

              <div className="hidden items-center rounded-lg border border-border bg-muted/60 lg:flex">
                <button
                  type="button" onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
                  aria-label={isDark ? 'Light mode' : 'Dark mode'}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5" aria-hidden /> : <Moon className="h-3.5 w-3.5" aria-hidden />}
                </button>
                <div className="h-4 w-px bg-border" />
                <div className="flex h-8 items-center px-1">
                  <NotificationCenter externalUnreadCount={activityUnreadCount} />
                </div>
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(o => !o)}
                  className="flex h-8 items-center gap-2 rounded-full bg-primary px-2 py-1 pr-3 text-xs font-bold text-primary-foreground ring-2 ring-transparent transition-all duration-200 hover:ring-primary/30"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/15 text-sm">
                    {user?.avatar ? (
                      <img
                        src={`${resolveApiAssetUrl(user.avatar)}?v=${encodeURIComponent(user.avatar)}`}
                        alt={user.name || 'Avatar'}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </span>
                  <span className="hidden text-[11px] sm:inline">{user?.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-primary-foreground/80 sm:block" aria-hidden />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {user?.avatar ? (
                          <img
                            src={`${resolveApiAssetUrl(user.avatar)}?v=${encodeURIComponent(user.avatar)}`}
                            alt={user.name || 'Avatar'}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); navigate('/profile') }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-accent"
                      >
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); navigate('/profile') }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-accent"
                      >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                        Account Settings
                      </button>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); void handleLogout() }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/25"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <PullToRefresh onRefresh={onPullRefresh}>
          <div className="content-sequence max-w-[100vw] px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:max-w-none lg:px-5 lg:py-5 lg:pb-5">
            <form onSubmit={handleSearch} className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 h-8 shadow-sm lg:mb-4">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-full w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search globally"
              />
            </form>
            <div key={`${location.pathname}-${outletKey}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Outlet />
            </div>
          </div>
        </PullToRefresh>
      </main>

      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        {showQuickActions && (
          <div className="rounded-2xl border border-border bg-card p-2 shadow-xl">
            {quickActions.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setShowQuickActions(false); navigate(item.path) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowQuickActions((value) => !value)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
          aria-label="Quick actions"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>
      </div>

      {/* Mobile bottom navigation — primary items only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border/80 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        role="navigation"
        aria-label="Primary"
      >
        <div className="mx-auto grid h-16 w-full max-w-lg grid-cols-3 items-stretch sm:grid-cols-6">
          {PRIMARY_MENU.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                title={item.label}
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium leading-none touch-manipulation",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} aria-hidden />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <MobileMoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={(e) => { handleSearch(e); setDrawerOpen(false) }}
        isDark={isDark}
        onToggleTheme={toggle}
        userName={user?.name}
        userEmail={user?.email}
        userAvatar={user?.avatar ? resolveApiAssetUrl(user.avatar) : null}
        onProfile={() => navigate("/profile")}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default DashboardLayout
