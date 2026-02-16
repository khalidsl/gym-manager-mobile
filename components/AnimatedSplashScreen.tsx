import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import * as SplashScreen from 'expo-splash-screen'

interface AnimatedSplashScreenProps {
  onFinish: () => void
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onFinish }) => {
  const logoScale = useSharedValue(0)
  const logoOpacity = useSharedValue(0)
  const textOpacity = useSharedValue(0)
  const backgroundOpacity = useSharedValue(0)

  useEffect(() => {
    // Empêche le splash screen natif de disparaître
    SplashScreen.preventAutoHideAsync()

    const startAnimation = () => {
      // Animation du background
      backgroundOpacity.value = withTiming(1, { duration: 500 })
      
      // Animation du logo avec delay
      logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }))
      logoScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 200 })
        )
      )

      // Animation du texte
      textOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))

      // Terminer l'animation après 2.5 secondes
      setTimeout(() => {
        runOnJS(finishSplash)()
      }, 2500)
    }

    startAnimation()
  }, [])

  const finishSplash = async () => {
    await SplashScreen.hideAsync()
    onFinish()
  }

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }))

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }))

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, backgroundStyle]}>
        <LinearGradient
          colors={['#FF6B35', '#F7931E', '#FFD700']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoBackground}>
          <MaterialIcons name="fitness-center" size={80} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.appName}>GYM MANAGER</Text>
        <Text style={styles.tagline}>Votre fitness connecté</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingContainer, textStyle]}>
        <View style={styles.loadingBar}>
          <Animated.View style={styles.loadingProgress} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: 200,
  },
  loadingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    width: '100%',
  },
})