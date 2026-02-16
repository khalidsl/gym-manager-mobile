import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useThemeContext } from '../contexts/ThemeContext'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface AnimatedButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: any
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  loading = false,
  icon,
  style,
}) => {
  const { colors, isDark } = useThemeContext()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
    opacity.value = withTiming(0.8)
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
    opacity.value = withTiming(1)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const getButtonStyle = () => {
    const base = {
      paddingHorizontal: size === 'small' ? Spacing.md : size === 'large' ? Spacing.xl : Spacing.lg,
      paddingVertical: size === 'small' ? Spacing.sm : size === 'large' ? Spacing.lg : Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    }

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: colors.primary,
        }
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.secondary,
        }
      case 'outline':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        }
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        }
      default:
        return base
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF'
      case 'outline':
      case 'ghost':
        return colors.text
      default:
        return colors.text
    }
  }

  return (
    <AnimatedTouchable
      style={[
        getButtonStyle(),
        animatedStyle,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          {
            color: getTextColor(),
            fontSize: size === 'small' ? FontSize.sm : size === 'large' ? FontSize.lg : FontSize.md,
            marginLeft: icon ? Spacing.xs : 0,
          },
        ]}
      >
        {loading ? 'Chargement...' : title}
      </Text>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  buttonText: {
    fontWeight: '600',
  },
})