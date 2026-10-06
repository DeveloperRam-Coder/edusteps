import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/ui/primitives/shadcn"
import { Input } from "@/ui/primitives/shadcn"
import { Label } from "@/ui/primitives/shadcn"
import { Alert, AlertDescription } from "@/ui/primitives/shadcn"
import { Separator } from "@/ui/primitives/shadcn"
import {
  User,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import heroImage from "@/assets/images/register-hero.jpg"
import logo from "@/assets/images/internsteps_logo.png"

export default function RegisterScreen() {
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = "Full name is required"
    if (!formData.email) e.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Invalid email address"
    if (!formData.password) e.password = "Password is required"
    else if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    try {
      await register({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      })
    } catch (error: any) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error?.message
      if (status === 409) {
        setErrors({ email: "Email already registered. Please sign in instead." })
      } else {
        setErrors({ general: message || "Registration failed. Please try again." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }))
    if (errors[key]) {
      const copy = { ...errors }
      delete copy[key]
      setErrors(copy)
    }
  }

  const passwordStrength = () => {
    let score = 0
    if (formData.password.length >= 6) score++
    if (formData.password.length >= 8) score++
    if (/[A-Z0-9!@#$%^&*]/.test(formData.password)) score++
    return score
  }

  const strengthColor =
    passwordStrength() === 0
      ? "bg-border"
      : passwordStrength() === 1
        ? "bg-red-500"
        : passwordStrength() === 2
          ? "bg-yellow-500"
          : "bg-emerald-500"

  const strengthLabel =
    passwordStrength() === 0 ? "" : passwordStrength() === 1 ? "Weak" : passwordStrength() === 2 ? "Fair" : "Strong"

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex items-center justify-center pattern-grid">
      {/* Decorative background glows — same as Login */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* ─── Left — Hero Panel (identical layout to Login) ─── */}
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
                <h1 className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                  InternSteps
                </h1>
              </div>
            </div>
            <div className="max-w-md text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <h2 className="text-3xl font-bold mb-4 text-white">Join us today!</h2>
              <p className="text-white/80 text-lg leading-relaxed font-light">
                Create your account and start your learning journey with InternSteps.
                Connect with mentors and build your professional skills.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Right — Form Panel (identical structure to Login) ─── */}
        <div className="p-6 flex items-center justify-center relative pattern-dots overflow-y-auto">
          {/* Subtle radial glow behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 py-8">
            {/* Mobile logo — shown only on small screens */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl shadow-xl mb-3 bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                <img src={logo} alt="InternSteps logo" className="w-11 h-11 object-contain" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                InternSteps
              </h1>
            </div>

            {/* ── Glassmorphic card — matches Login ── */}
            <div className="glass-card rounded-2xl shadow-2xl p-8 border border-border/40 relative overflow-hidden backdrop-blur-xl">
              {/* Gradient top accent bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Create account</h2>
                <p className="text-sm text-muted-foreground">Fill in your details to get started</p>
              </div>

              {/* General error alert */}
              {errors.general && (
                <Alert variant="destructive" className="mb-5 border-destructive/25 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-xs">{errors.general}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* ── Row 1: Full Name + Email ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        disabled={loading}
                        autoFocus
                        autoComplete="name"
                        className="pl-9 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        className="pl-9 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* ── Row 2: Mobile + Password ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                      Mobile <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="10-digit number"
                        value={formData.mobile}
                        onChange={(e) => handleChange("mobile", e.target.value)}
                        disabled={loading}
                        autoComplete="tel"
                        className="pl-9 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.mobile}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        disabled={loading}
                        autoComplete="new-password"
                        className="pl-9 pr-10 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* ── Confirm Password — full width ── */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-foreground font-semibold tracking-wide uppercase">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                      className="pl-9 pr-10 h-11 text-sm rounded-xl bg-card/50 border-border/80 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* ── Password strength indicator ── */}
                {formData.password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i < passwordStrength() ? strengthColor : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    {strengthLabel && (
                      <p className="text-[11px] text-muted-foreground font-medium">
                        Password strength:{" "}
                        <span
                          className={
                            passwordStrength() === 1
                              ? "text-red-500"
                              : passwordStrength() === 2
                                ? "text-yellow-600"
                                : "text-emerald-600"
                          }
                        >
                          {strengthLabel}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* ── Submit button — gradient, same as Login ── */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="w-full h-11 text-sm rounded-xl font-bold bg-gradient-to-r from-primary via-indigo-600 to-blue-600 hover:from-primary/95 hover:to-blue-600/95 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 mt-2"
                >
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <Separator className="flex-1 bg-border/60" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">or</span>
                <Separator className="flex-1 bg-border/60" />
              </div>

              {/* Sign in link — styled as outline button, same as Login's "Create account" link */}
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-11 text-sm rounded-xl border border-border bg-card/30 hover:bg-accent font-semibold transition-all"
                >
                  Already have an account? Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
