import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'

export type Theme = 'light' | 'dark'

const THEME_KEY = '@gym_manager_theme'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY)
      if (savedTheme) {
        setTheme(savedTheme as Theme)
      } else {
        // Utilise le thème système par défaut
        const systemTheme = Appearance.getColorScheme() || 'light'
        setTheme(systemTheme)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTheme = async () => {
    try {
      const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      await AsyncStorage.setItem(THEME_KEY, newTheme)
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  const setThemeMode = async (newTheme: Theme) => {
    try {
      setTheme(newTheme)
      await AsyncStorage.setItem(THEME_KEY, newTheme)
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  return {
    theme,
    isLoading,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
  }
}