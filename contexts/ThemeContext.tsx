import React, { createContext, useContext, ReactNode } from 'react'
import { useTheme, Theme } from '../hooks/useTheme'
import { Colors, LightTheme, DarkTheme } from '../constants/Colors'

interface ThemeContextType {
  theme: Theme
  colors: typeof LightTheme
  isDark: boolean
  isLoading: boolean
  toggleTheme: () => void
  setThemeMode: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const themeHook = useTheme()
  
  const colors = themeHook.theme === 'dark' ? DarkTheme : LightTheme

  return (
    <ThemeContext.Provider
      value={{
        ...themeHook,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}