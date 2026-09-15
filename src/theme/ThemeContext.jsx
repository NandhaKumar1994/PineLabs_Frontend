import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'theme1', setTheme: () => {}, toggleTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('theme1')

  // Apply the theme to the root element so CSS variables can respond.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'theme1' ? 'theme2' : 'theme1'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
