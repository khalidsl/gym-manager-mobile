import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/Colors'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }

    // Size
    if (size === 'small') {
      baseStyle.paddingHorizontal = Spacing.md
      baseStyle.paddingVertical = Spacing.sm
    } else if (size === 'large') {
      baseStyle.paddingHorizontal = Spacing.xl
      baseStyle.paddingVertical = Spacing.md
    } else {
      baseStyle.paddingHorizontal = Spacing.lg
      baseStyle.paddingVertical = Spacing.md
    }

    // Variant
    if (variant === 'primary') {
      baseStyle.backgroundColor = disabled ? Colors.light.disabled : Colors.light.primary
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = disabled ? Colors.light.disabled : Colors.light.secondary
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent'
      baseStyle.borderWidth = 1
      baseStyle.borderColor = disabled ? Colors.light.disabled : Colors.light.primary
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = 'transparent'
    }

    if (fullWidth) {
      baseStyle.width = '100%'
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: FontWeight.semibold,
    }

    if (size === 'small') {
      baseTextStyle.fontSize = FontSize.sm
    } else if (size === 'large') {
      baseTextStyle.fontSize = FontSize.lg
    } else {
      baseTextStyle.fontSize = FontSize.md
    }

    if (variant === 'primary' || variant === 'secondary') {
      baseTextStyle.color = '#FFFFFF'
    } else if (variant === 'outline' || variant === 'ghost') {
      baseTextStyle.color = disabled ? Colors.light.disabled : Colors.light.primary
    }

    if (disabled) {
      baseTextStyle.color = Colors.light.textSecondary
    }

    return baseTextStyle
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.light.primary : '#FFFFFF'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}
