import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen({ navigation }: any) {
  const { signIn, loading } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide'
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis'
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur de connexion')
    }
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.80 }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Gym Manager</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.loginButton}
          />

          <Button
            title="Créer un compte"
            onPress={() => navigation.navigate('Register')}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
})
