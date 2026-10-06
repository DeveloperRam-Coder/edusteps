import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/ui/primitives/shadcn"
import { Input } from "@/ui/primitives/shadcn"
import { Label } from "@/ui/primitives/shadcn"
import { Alert, AlertDescription } from "@/ui/primitives/shadcn"
import { Separator } from "@/ui/primitives/shadcn"
import { AtSign, Lock, Eye, EyeOff, AlertCircle, Sparkles, Smartphone } from "lucide-react"
import heroImage from "@/assets/images/register-hero.jpg"
import logo from "@/assets/images/internsteps_logo.png"

/** Returns true for a 10–15 digit string (mobile), false for an email, null if neither */
function classifyIdentifier(value: string): 'mobile' | 'email' | 'invalid' | 'empty' {
  const v = value.trim()
  if (!v) return 'empty'
  const digits = v.replace(/\D/g, '')
  if (/^\d{10,15}$/.test(digits)) return 'mobile'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email'
  return 'invalid'
}

export default function LoginScreen() {
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({})

  const identifierType = classifyIdentifier(identifier)
  const IdentifierIcon = identifierType === 'mobile' ? Smartphone : AtSign

  const validateForm = () => {
    const e: typeof errors = {}

    if (identifierType === 'empty') {
      e.identifier = "Email or mobile number is required"
    } else if (identifierType === 'invalid') {
      e.identifier = "Enter a valid email address or mobile number"
    }

    if (!password) e.password = "Password is required"

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      await login(identifier.trim(), password)
    } catch (error) {
      setErrors({
        general: (error as Error)?.message || "Invalid credentials. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) setErrors((prev) => { const c = { ...prev }; delete c[field]; return c })
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex items-center justify-center pattern-grid">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* Left — Hero */}
        <div className="hidden lg:flex relative overflow-hidden">
          <img src={heroImage} alt="Students in lecture hall" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-indigo-900/85 to-slate-950/95" />
          <div className="absolute inset-0 pattern-dots opacity-20" />
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
            <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 rounded-3xl shadow-2xl mb-6 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:scale-105 transition-transform duration-300">
                <img src={logo} alt="InternSteps logo" className="w-18 h-18 object-contain filter drop-shadow-md" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-7 h-7 text-yellow-300 filter drop-shadow-[0_2px_8px_rgba(253,224,71,0.5)] animate-pulse" />
                <h1 className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">InternSteps</h1>
              </div>
            </div>
            <div className="max-w-md text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <h2 className="text-3xl font-bold mb-4 text-white">Welcome back!</h2>
              <p className="text-white/80 text-lg leading-relaxed font-light">
                Sign in with your registered email or mobile number to access your workspace and manage student lifecycles.
              </p>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="p-6 flex items-center justify-center relative pattern-dots">
          {/* Subtle back card glow for form container */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl shadow-xl mb-3 bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                <img src={logo} alt="InternSteps logo" className="w-11 h-11 object-contain" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">InternSteps</h1>
            </div>

            <div className="glass-card rounded-2xl shadow-2xl p-8 border border-border/40 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Sign in</h2>
                <p className="text-sm text-muted-foreground">Use your registered email or mobile number</p>
              </div>

              {errors.general && (
                <Alert variant="destructive" className="mb-5 border-destructive/25 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-xs">{errors.general}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* Identifier field — Email or Mobile */}
                <div className="space-y-1.5">
                  <Label htmlFor="identifier" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                    Email or Mobile Number
                  </Label>
                  <div className="relative">
                    <IdentifierIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-all" />
                    <Input
                      id="identifier"
                      type="text"
                      inputMode={identifierType === 'mobile' ? 'numeric' : 'email'}
                      placeholder="email@example.com or 9876543210"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); clearFieldError('identifier') }}
                      disabled={loading}
                      className="pl-9 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.identifier}</p>
                  )}
                  {/* Live type hint — only shown once user has typed enough */}
                  {identifier.length >= 3 && !errors.identifier && (
                    <p className="text-[11px] text-primary font-semibold transition-all">
                      {identifierType === 'mobile' && '✓ Detected: mobile number'}
                      {identifierType === 'email' && '✓ Detected: email address'}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-foreground font-semibold tracking-wide uppercase">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
                      disabled={loading}
                      className="pl-9 pr-10 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <span className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-help">Contact admin to reset password</span>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="w-full h-11 text-sm rounded-xl font-bold bg-gradient-to-r from-primary via-indigo-600 to-blue-600 hover:from-primary/95 hover:to-blue-600/95 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <Separator className="flex-1 bg-border/60" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">or</span>
                <Separator className="flex-1 bg-border/60" />
              </div>

              <Link to="/register">
                <Button variant="outline" size="sm" className="w-full h-11 text-sm rounded-xl border border-border bg-card/30 hover:bg-accent font-semibold transition-all">
                  Create new account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
