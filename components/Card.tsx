import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, BorderRadius, Spacing } from '../constants/Colors'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'elevated' | 'outlined' | 'filled'
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      backgroundColor: Colors.light.card,
    }

    if (variant === 'elevated') {
      baseStyle.shadowColor = '#000'
      baseStyle.shadowOffset = { width: 0, height: 2 }
      baseStyle.shadowOpacity = 0.1
      baseStyle.shadowRadius = 8
      baseStyle.elevation = 3
    } else if (variant === 'outlined') {
      baseStyle.borderWidth = 1
      baseStyle.borderColor = Colors.light.border
    } else if (variant === 'filled') {
      baseStyle.backgroundColor = Colors.light.background
    }

    return baseStyle
  }

  return <View style={[getCardStyle(), style]}>{children}</View>
}
