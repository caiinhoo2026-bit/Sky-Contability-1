'use client'

import React from 'react'
import { useTheme, type AppTheme } from './ThemeProvider'

const LABEL: Record<AppTheme, string> = {
  dark: 'Dark',
  dark_glass: 'Glass',
  dark_gradient: 'Gradient',
  light: 'Light',
}

export function ThemeSwitcher() {
  const { theme, setTheme, cycleTheme } = useTheme()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-3 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={cycleTheme}
          className="text-xs font-medium text-white/80 hover:text-white transition"
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          Tema: <span className="text-white">{LABEL[theme]}</span>
        </button>

        <select
          className="text-xs bg-transparent text-white/80 outline-none"
          value={theme}
          onChange={(e) => setTheme(e.target.value as AppTheme)}
          aria-label="Selecionar tema"
        >
          {Object.entries(LABEL).map(([k, v]) => (
            <option key={k} value={k} className="text-black">
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
