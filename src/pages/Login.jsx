import BrandPanel from '../components/BrandPanel.jsx'
import LoginCard from '../components/LoginCard.jsx'
import { useTheme } from '../theme/ThemeContext'

export default function Login({ onSignIn }) {
  const { theme } = useTheme()

  // Theme 2 mirrors the layout: form on the left, brand panel on the right,
  // with a wider form column for a distinct feel.
  if (theme === 'theme2') {
    return (
      <div className="grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-[1fr_1.1fr]">
        <LoginCard onSignIn={onSignIn} />
        <BrandPanel />
      </div>
    )
  }

  return (
    <div className="grid h-screen w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-[1.25fr_1fr]">
      <BrandPanel />
      <LoginCard onSignIn={onSignIn} />
    </div>
  )
}
