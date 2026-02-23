import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ImageBackground 
} from 'react-native'
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useAuthStore } from '../../store/authStore'

// Import Admin Screens
import AdminDashboard from './dashboard'
import AdminMembers from './members'
import AdminMachines from './machines'
import AdminClasses from './classes'
import AdminAccessLogs from './access-logs'
import QRGeneratorScreen from './qr-generator'
import AdminReports from './reports'
import AdminSettings from './settings'

const Drawer = createDrawerNavigator()

// ========== THEME COLORS ==========
const ADMIN_COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F77F00',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  
  // Backgrounds
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
  
  // Drawer
  drawerActive: '#FF6B35',
  drawerInactive: '#B8C1EC',
  drawerBackground: '#0A0E27',
  drawerSurface: '#1A1F3A',
}

// ========== DRAWER MENU ITEMS ==========
const DRAWER_MENU = [
  {
    name: 'AdminDashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    component: AdminDashboard,
  },
  {
    name: 'AdminMembers',
    label: 'Membres',
    icon: 'people',
    component: AdminMembers,
  },
  {
    name: 'AdminMachines',
    label: 'Machines',
    icon: 'fitness-center',
    component: AdminMachines,
  },
  {
    name: 'AdminClasses',
    label: 'Cours',
    icon: 'event',
    component: AdminClasses,
  },
  {
    name: 'AdminAccessLogs',
    label: 'Accès',
    icon: 'history',
    component: AdminAccessLogs,
  },
  {
    name: 'QRGeneratorScreen',
    label: 'Codes QR',
    icon: 'qr-code',
    component: QRGeneratorScreen,
  },
  {
    name: 'AdminReports',
    label: 'Rapports',
    icon: 'assessment',
    component: AdminReports,
  },
  {
    name: 'AdminSettings',
    label: 'Paramètres',
    icon: 'settings',
    component: AdminSettings,
  },
]

// ========== CUSTOM DRAWER CONTENT ==========
function AdminDrawerContent(props: DrawerContentComponentProps) {
  const { signOut, user } = useAuthStore()

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Se déconnecter', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    )
  }

  const currentRoute = props.state.routes[props.state.index]?.name

  return (
    <LinearGradient 
      colors={[ADMIN_COLORS.drawerBackground, ADMIN_COLORS.drawerSurface]}
      style={styles.drawerContainer}
    >
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Admin */}
        <View style={styles.drawerHeader}>
          <LinearGradient
            colors={['#FF6B35', '#F77F00']}
            style={styles.adminAvatar}
          >
            <MaterialIcons name="admin-panel-settings" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.adminName}>
            {String(user?.user_metadata?.full_name || 'Administrateur')}
          </Text>
          <Text style={styles.adminRole}>Panel Admin</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {DRAWER_MENU.map((item, index) => {
            const isActive = currentRoute === item.name
            
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive
                ]}
                onPress={() => props.navigation.navigate(item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <LinearGradient
                    colors={isActive 
                      ? ['#FF6B35', '#F77F00'] 
                      : ['transparent', 'transparent']
                    }
                    style={[styles.menuIconContainer, isActive && styles.menuIconActive]}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={24} 
                      color={isActive ? '#fff' : ADMIN_COLORS.drawerInactive} 
                    />
                  </LinearGradient>
                  <Text style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive
                  ]}>
                    {String(item.label)}
                  </Text>
                </View>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer - Logout */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EF476F', '#DC2626']}
            style={styles.logoutGradient}
          >
            <MaterialIcons name="logout" size={22} color="#fff" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Admin v1.0</Text>
      </View>
    </LinearGradient>
  )
}

// ========== MAIN ADMIN LAYOUT ==========
export default function AdminLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AdminDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: ADMIN_COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: ADMIN_COLORS.surfaceLight,
        },
        headerTintColor: ADMIN_COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: ADMIN_COLORS.textPrimary,
        },
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: 'transparent',
        },
        swipeEnabled: true,
      }}
    >
      {DRAWER_MENU.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
          options={{
            title: item.label,
            headerTitle: `Admin - ${item.label}`,
          }}
        />
      ))}
    </Drawer.Navigator>
  )
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  // Drawer Container
  drawerContainer: {
    flex: 1,
  },
  drawerScrollView: {
    paddingTop: 0,
  },

  // Header
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.surfaceLight,
  },
  adminAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ADMIN_COLORS.textPrimary,
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: ADMIN_COLORS.drawerActive,
    fontWeight: '600',
  },

  // Menu
  menuContainer: {
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  menuItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: ADMIN_COLORS.surfaceLight,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuIconActive: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: ADMIN_COLORS.drawerInactive,
  },
  menuLabelActive: {
    color: ADMIN_COLORS.textPrimary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -15 }],
    width: 4,
    height: 30,
    backgroundColor: ADMIN_COLORS.drawerActive,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },

  // Footer
  drawerFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.surfaceLight,
    paddingTop: 20,
  },
  logoutButton: {
    marginBottom: 15,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  versionText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})