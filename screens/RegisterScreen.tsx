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
  TouchableOpacity,
} from 'react-native'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'

export default function RegisterScreen({ navigation }: any) {
  const { signUp, loading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nom complet requis'
    }

    if (!formData.email) {
      newErrors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
      })
      
      Alert.alert(
        'Inscription réussie',
        'Votre compte a été créé avec succès!',
        [{ text: 'OK' }]
      )
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💪</Text>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez notre communauté fitness</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="Nom complet"
                placeholder="khalid salhi"
                value={formData.fullName}
                onChangeText={(value) => updateField('fullName', value)}
                error={errors.fullName}
              />

              <Input
                label="Email"
                placeholder="votre@email.com"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <Input
                label="Téléphone (optionnel)"
                placeholder="06 06 56 54 35"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                keyboardType="phone-pad"
              />

              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                error={errors.password}
              />

              <Input
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry
                error={errors.confirmPassword}
              />

              <Button
                title="S'inscrire"
                onPress={handleRegister}
                loading={loading}
                fullWidth
                style={styles.registerButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>
                  J'ai déjà un compte ? <Text style={styles.loginTextBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Espace pour éviter que le clavier cache le contenu */}
          <View style={styles.bottomSpacer} />
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
  imageStyle: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: FontSize.xxl + 4,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 12,
    height: 54,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    color: '#94A3B8',
    fontWeight: '500',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  loginText: {
    fontSize: FontSize.md,
    color: '#64748B',
  },
  loginTextBold: {
    fontWeight: FontWeight.bold,
    color: Colors.primary || '#3B82F6',
  },
  bottomSpacer: {
    height: 40,
  },
})