'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type AppTheme = 'dark' | 'dark_glass' | 'dark_gradient' | 'light'

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEMES: AppTheme[] = ['dark', 'dark_glass', 'dark_gradient', 'light']
const STORAGE_KEY = 'sky_theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('dark')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as AppTheme | null) : null
    if (saved && THEMES.includes(saved)) setThemeState(saved)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, theme)

    // Apply on <html> so it affects the whole app
    const el = document.documentElement
    el.dataset.theme = theme

    // Sync with Tailwind's darkMode: 'class'
    if (theme.startsWith('dark')) {
      el.classList.add('dark')
    } else {
      el.classList.remove('dark')
    }
  }, [theme])

  const setTheme = (t: AppTheme) => setThemeState(t)

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    setThemeState(next)
  }

  const value = useMemo(() => ({ theme, setTheme, cycleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
