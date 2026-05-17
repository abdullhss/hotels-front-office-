import bgImage from '../assets/hotels login image.webp'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { checkLogin } from '../services/apiServices'

function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const gradientAngle = isArabic ? 90 : 270
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const email = username.trim()

    if (!email || !password) {
      toast.error(t('login.requiredFields'))
      return
    }

    setIsSubmitting(true)
    const result = await checkLogin(email, password)
    setIsSubmitting(false)

    const rawUserData = result?.data?.userData
    let parsedUserData = []

    if (typeof rawUserData === 'string' && rawUserData.trim()) {
      try {
        parsedUserData = JSON.parse(rawUserData)
      } catch {
        parsedUserData = []
      }
    } else if (Array.isArray(rawUserData)) {
      parsedUserData = rawUserData
    }

    const hasUserData = Array.isArray(parsedUserData) && parsedUserData.length > 0
    const isLoginSuccessful = Boolean(result?.authenticated || hasUserData)

    if (!isLoginSuccessful) {
      toast.error(result?.message || t('login.invalidCredentials'))
      return
    }

    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userData', JSON.stringify(parsedUserData))
    localStorage.setItem('userRole', result?.data?.userRole ? String(result.data.userRole) : '')
    if (result?.token) {
      localStorage.setItem('SessionID', result.token)
    }
    toast.success(t('login.success'))
    navigate('/', { replace: true })
  }

  return (
    <main
      className="relative box-border flex min-h-screen items-center overflow-hidden bg-cover bg-center bg-no-repeat px-[72px] py-10 max-[900px]:justify-center max-[900px]:px-5 max-[900px]:py-7"
      style={{
        backgroundImage: `
          linear-gradient(${gradientAngle}deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.84) 46.47%),
          url(${bgImage})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay Gradient */}

      <section className="relative z-[1] w-full max-w-[460px] text-[#f5f7ff]" aria-label={t('login.ariaLabel')}>
        <p className="m-0 text-[0.86rem] font-bold tracking-[0.33em]">LUXESTAY</p>
        <p className="mb-[22px] mt-1 text-[rgba(223,229,255,0.75)]">{t('login.subtitle')}</p>

        <h1 className="m-0 text-[clamp(2rem,5vw,3.1rem)] leading-[1.15] text-white">
          {t('login.title')}
        </h1>
        <p className="mb-7 mt-3 text-[rgba(223,229,255,0.75)]">
          {t('login.description')}
        </p>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-[7px]">
            <span className="text-[0.84rem] text-[rgba(232,236,255,0.9)]">
              {t('login.username')}
            </span>
            <input
              type="text"
              placeholder="AHMED"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="h-12 w-full box-border rounded-[999px] border border-[rgba(121,133,188,0.45)] bg-[rgba(13,18,39,0.52)] px-[18px] text-[0.95rem] text-[#f9faff] outline-none placeholder:text-[rgba(184,193,227,0.86)] focus:border-[#7887ff] focus:shadow-[0_0_0_3px_rgba(120,135,255,0.2)]"
            />
          </label>

          <label className="grid gap-[7px]">
            <span className="text-[0.84rem] text-[rgba(232,236,255,0.9)]">
              {t('login.password')}
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-12 w-full box-border rounded-[999px] border border-[rgba(121,133,188,0.45)] bg-[rgba(13,18,39,0.52)] px-[18px] pe-12 text-[0.95rem] text-[#f9faff] outline-none placeholder:text-[rgba(184,193,227,0.86)] focus:border-[#7887ff] focus:shadow-[0_0_0_3px_rgba(120,135,255,0.2)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-e-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 text-[rgba(226,232,255,0.9)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="mb-[6px] mt-[2px] flex items-center justify-between text-[0.9rem]">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="h-[15px] w-[15px]" />
              <span>{t('login.rememberMe')}</span>
            </label>
            <a
              href="/"
              onClick={(event) => event.preventDefault()}
              className="text-[rgba(227,232,255,0.84)] no-underline"
            >
              {t('login.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 h-[50px] cursor-pointer rounded-[999px] border-none bg-[linear-gradient(135deg,#6556ff,#5a42f1)] text-base font-semibold text-white"
          >
            {isSubmitting ? t('login.loading') : t('login.submit')}
          </button>
        </form>

        <div className="mt-[26px] flex justify-start gap-[10px]">
          <button
            type="button"
            onClick={() => i18n.changeLanguage('ar')}
            className={`min-w-[112px] cursor-pointer rounded-[999px] border border-[rgba(132,144,193,0.45)] px-4 py-[7px] ${isArabic ? 'bg-white text-[#233073]' : 'bg-[rgba(13,18,39,0.45)] text-[rgba(226,232,255,0.9)]'}`}
          >
            {t('common.arabic')}
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            className={`min-w-[112px] cursor-pointer rounded-[999px] border border-[rgba(132,144,193,0.45)] px-4 py-[7px] ${!isArabic ? 'bg-white text-[#233073]' : 'bg-[rgba(13,18,39,0.45)] text-[rgba(226,232,255,0.9)]'}`}
          >
            {t('common.english')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login