import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from './store/authStore'

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

// Constants
const COLORS = {
  primary: '#6C63FF',
  inactive: '#999',
  error: '#dc3545',
  text: '#6c757d',
  background: '#f8f9fa',
}

const TAB_ICONS: { [key: string]: string } = {
  Dashboard: 'home',
  Machines: 'fitness-center',
  Scanner: 'qr-code-scanner',
  Schedule: 'calendar-today',
  Profile: 'person',
}

// Components
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconName = TAB_ICONS[name] || 'circle'
  const color = focused ? COLORS.primary : COLORS.inactive
  
  return <MaterialIcons name={iconName} size={26} color={color} />
}

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
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Une erreur s'est produite</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Erreur inconnue'}
          </Text>
          <Text style={styles.errorHint}>
            Veuillez redémarrer l'application
          </Text>
        </View>
      )
    }

    return this.props.children
  }
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          title: 'Accueil',
          headerTransparent: true,
        }}
      />
      <Tab.Screen 
        name="Machines" 
        component={MachinesScreen}
        options={{ title: 'Machines' }}
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScannerScreen}
        options={{ title: 'Scanner' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'Planning' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const { initialize, initialized, session } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="auto" />
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
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
})
