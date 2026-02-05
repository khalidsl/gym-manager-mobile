import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { View, Text, StyleSheet } from 'react-native'
import { useAuthStore } from './store/authStore'

// Screens
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/DashboardScreen'
import MachinesScreen from './screens/MachinesScreen'
import ScannerScreen from './screens/ScannerScreen'
import ScheduleScreen from './screens/ScheduleScreen'
import ProfileScreen from './screens/ProfileScreen'

// Composant pour les icônes
const TabIcon = ({ name, color }: { name: string; color: string }) => {
  const icons: { [key: string]: string } = {
    Dashboard: '🏠',
    Machines: '💪',
    Scanner: '📷',
    Schedule: '📅',
    Profile: '👤',
  }
  
  return (
    <Text style={{ fontSize: 24 }}>{icons[name] || '•'}</Text>
  )
}

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Error Boundary Component
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
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIcon: ({ color }) => (
          <TabIcon name={route.name} color={color} />
        ),
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Accueil' }}
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
  }, [])

  if (!initialized) {
    return null
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
})
