import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/ALMUS TECH BLUE.png"
            alt="ALMUS TECH"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            {t('auth.loginTitle')}
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <Input
            id="email"
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />

          {/* Password Input */}
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-12 text-base pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? t('common.loading') : t('auth.loginButton')}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700 text-sm block"
          >
            {t('auth.forgotPassword')}
          </a>
          <p className="text-gray-600 text-sm">
            {t('auth.noAccount')}
          </p>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm block"
          >
            {t('auth.backToMain')}
          </a>
        </div>
      </div>
    </div>
  )
}
