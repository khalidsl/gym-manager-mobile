import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from './store/authStore'
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext'

// Screens
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/DashboardScreen'
import MachinesScreen from './screens/MachinesScreen'
import ScannerScreen from './screens/ScannerScreen'
import ScheduleScreen from './screens/ScheduleScreen'
import ProfileScreen from './screens/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// ========== THEME COLORS (Style Gym Moderne) ==========
const COLORS = {
  primary: '#FF6B35',        // Orange énergique
  secondary: '#004E89',      // Bleu profond
  accent: '#F77F00',         // Orange vif
  success: '#06D6A0',        // Vert success
  warning: '#FFD23F',        // Jaune warning
  danger: '#EF476F',         // Rouge danger
  
  // Backgrounds
  background: '#0A0E27',     // Bleu très sombre (dark mode)
  surface: '#1A1F3A',        // Bleu foncé pour cards
  surfaceLight: '#252B4A',   // Bleu moyen
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
  
  // Tab bar
  tabActive: '#FF6B35',
  tabInactive: '#6C7A9B',
  
  // Status
  online: '#06D6A0',
  offline: '#EF476F',
}

const GRADIENTS = {
  primary: ['#FF6B35', '#F77F00'],
  secondary: ['#004E89', '#1A659E'],
  dark: ['#0A0E27', '#1A1F3A'],
  card: ['#1A1F3A', '#252B4A'],
}

const TAB_ICONS: { [key: string]: string } = {
  Dashboard: 'home',
  Machines: 'fitness-center',
  Scanner: 'qr-code-scanner',
  Schedule: 'calendar-today',
  Profile: 'person',
}

// ========== COMPONENTS ==========

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconName = TAB_ICONS[name] || 'circle'
  const color = focused ? COLORS.tabActive : COLORS.tabInactive
  const size = focused ? 28 : 24
  
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <MaterialIcons name={iconName} size={size} color={color} />
      {focused && <View style={styles.tabIndicator} />}
    </View>
  )
}

const LoadingScreen = () => (
  <LinearGradient colors={GRADIENTS.dark} style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <MaterialIcons name="fitness-center" size={80} color={COLORS.primary} />
      <Text style={styles.loadingTitle}>GYM MANAGER</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>Chargement de votre espace...</Text>
    </View>
  </LinearGradient>
)

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={GRADIENTS.dark} style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <MaterialIcons name="error-outline" size={80} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Oups ! Une erreur s'est produite</Text>
            <Text style={styles.errorText}>
              {this.state.error?.message || 'Erreur inconnue'}
            </Text>
            <View style={styles.errorHintContainer}>
              <MaterialIcons name="info" size={16} color={COLORS.textMuted} />
              <Text style={styles.errorHint}>
                Veuillez redémarrer l'application
              </Text>
            </View>
          </View>
        </LinearGradient>
      )
    }

    return this.props.children
  }
}

// ========== NAVIGATION ==========

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.surfaceLight,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          title: 'Accueil',
          headerShown: true,
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Machines" 
        component={MachinesScreen}
        options={{ 
          title: 'Équipements',
          tabBarLabel: 'Machines',
        }}
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScannerScreen}
        options={{ 
          title: 'Scanner QR',
          tabBarLabel: 'Scanner',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ 
          title: 'Planning',
          tabBarLabel: 'Planning',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Mon Profil',
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  )
}

// ========== MAIN APP ==========

export default function App() {
  const { initialize, initialized, session } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return <LoadingScreen />
  }

  return (
    <CustomThemeProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!session ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              <Stack.Screen name="Main" component={TabNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </CustomThemeProvider>
  )
}

// ========== STYLES ==========

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
    letterSpacing: 2,
  },
  loadingSpinner: {
    marginTop: 30,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 15,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // Tab Bar
  tabBar: {
    height: 70,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  tabIconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tabActive,
  },
})
