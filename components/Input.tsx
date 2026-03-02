import React, { useState } from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/Colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isPassword?: boolean
  containerStyle?: ViewStyle
  inputStyle?: TextStyle
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const renderRightIcon = () => {
    if (isPassword) {
      return (
        <TouchableOpacity onPress={togglePasswordVisibility} activeOpacity={0.7}>
          <MaterialIcons
            name={showPassword ? "visibility" : "visibility-off"}
            size={24}
            color={Colors.light.textSecondary || '#94A3B8'}
          />
        </TouchableOpacity>
      )
    }
    if (rightIcon) {
      return rightIcon
    }
    return null
  }

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
          placeholderTextColor={Colors.light.placeholder || '#94A3B8'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !showPassword : textInputProps.secureTextEntry}
          {...textInputProps}
        />

        {renderRightIcon() && <View style={styles.iconRight}>{renderRightIcon()}</View>}
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
