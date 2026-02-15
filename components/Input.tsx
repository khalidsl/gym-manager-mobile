import React, { useState } from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native'
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: ViewStyle
  inputStyle?: TextStyle
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.light.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainerFocused: {
    borderColor: '#6C63FF',
    borderWidth: 2,
    shadowOpacity: 0.15,
  },
  inputContainerError: {
    borderColor: Colors.light.error,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: '#1E293B',
    fontWeight: '500',
    paddingVertical: Spacing.md,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.light.error,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
})
