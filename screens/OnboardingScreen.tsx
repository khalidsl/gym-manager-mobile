import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ImageBackground } from 'react-native'
import PagerView from 'react-native-pager-view'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useThemeContext } from '../contexts/ThemeContext'
import { AnimatedButton } from '../components/AnimatedButton'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

const { width, height } = Dimensions.get('window')
const ONBOARDING_KEY = '@gym_manager_onboarding_completed'

interface OnboardingScreenProps {
  onComplete: () => void
}

interface SlideData {
  title: string
  subtitle: string
  description: string
  icon: string
  gradient: string[]
}

const slides: SlideData[] = [
  {
    title: 'Bienvenue',
    subtitle: 'dans Gym Manager',
    description: 'Gérez votre expérience fitness de manière intelligente et connectée.',
    icon: 'waving-hand',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    title: 'Accès QR Code',
    subtitle: 'Simple et rapide',
    description: 'Scannez votre QR code pour entrer et sortir de la salle en toute simplicité.',
    icon: 'qr-code-2',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    title: 'Machines connectées',
    subtitle: 'Suivez vos performances',
    description: 'Démarrez vos sessions sur les machines et suivez vos progrès en temps réel.',
    icon: 'fitness-center',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    title: 'Profil personnalisé',
    subtitle: 'Votre espace membre',
    description: 'Consultez vos statistiques, votre abonnement et votre historique.',
    icon: 'person',
    gradient: ['#43e97b', '#38f9d7'],
  },
]

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useThemeContext()
  const [currentPage, setCurrentPage] = useState(0)
  const pagerRef = useRef<PagerView>(null)
  const progress = useSharedValue(0)

  const handlePageSelected = (e: any) => {
    const page = e.nativeEvent.position
    setCurrentPage(page)
    progress.value = withSpring(page / (slides.length - 1))
  }

  const handleNext = () => {
    if (currentPage < slides.length - 1) {
      pagerRef.current?.setPage(currentPage + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
      onComplete()
    } catch (error) {
      console.error('Error saving onboarding state:', error)
    }
  }

  const progressStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.33, 0.66, 1],
      ['#667eea', '#f5576c', '#4facfe', '#43e97b']
    )

    return {
      width: withSpring(`${((currentPage + 1) / slides.length) * 100}%`),
      backgroundColor,
    }
  })

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.container}
      imageStyle={{ opacity: 0.3 }}
      resizeMode="cover"
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Passer</Text>
        </TouchableOpacity>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <LinearGradient
              colors={slide.gradient as any}
              style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
            />

            <View style={styles.slideContent}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconBackground}
                >
                  <MaterialIcons name={slide.icon as any} size={80} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </PagerView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: currentPage === index ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                  transform: [{ scale: currentPage === index ? 1.2 : 1 }],
                },
              ]}
            />
          ))}
        </View>

        <AnimatedButton
          title={currentPage === slides.length - 1 ? 'Commencer' : 'Suivant'}
          onPress={handleNext}
          variant="primary"
          style={styles.nextButton}
        />
      </View>
    </ImageBackground>
  )
}

// Hook pour vérifier si l'onboarding a été complété
export const useOnboarding = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null)

  React.useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
      setIsCompleted(completed === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setIsCompleted(false)
    }
  }

  return isCompleted
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginRight: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xl,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  navigation: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    minWidth: 200,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
})