import React, { useEffect, useState, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  TouchableOpacity, 
  ImageBackground,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/Colors'
import { supabase } from '../services/supabase'

interface Class {
  id: string
  name: string
  description: string
  coach_id: string
  start_time: string
  end_time: string
  max_capacity: number
  day_of_week: number
}

interface Booking {
  id: string
  user_id: string
  class_id: string
  booking_date: string
  status: string
  created_at: string
}

// ==================== ANIMATED LOADING ====================
const AnimatedLoading = () => {
  const spinAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseAnim }] }}>
        <LinearGradient
          colors={['#6C63FF', '#4C51BF']}
          style={styles.loadingGradient}
        >
          <MaterialIcons name="event" size={48} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.loadingText}>Chargement du planning...</Text>
    </View>
  )
}

// ==================== ANIMATED CLASS CARD ====================
const AnimatedClassCard = ({ 
  classItem, 
  booked, 
  onBook, 
  onCancel,
  index,
}: any) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const badgePulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Entrée avec delay basé sur l'index
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse du badge si réservé
    if (booked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(badgePulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [booked, index])

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start()

    booked ? onCancel() : onBook()
  }

  return (
    <Animated.View
      style={[
        styles.classCardContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <BlurView intensity={booked ? 90 : 70} tint="light" style={styles.classCardBlur}>
        <LinearGradient
          colors={booked 
            ? ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']
          }
          style={styles.classCard}
        >
          <View style={styles.classHeader}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <View style={styles.instructorRow}>
                <MaterialIcons name="person" size={14} color="#6C63FF" />
                <Text style={styles.instructor}>
                  {classItem.coach?.full_name || 'Coach'}
                </Text>
              </View>
            </View>
            
            {booked && (
              <Animated.View style={[
                styles.bookedBadge,
                { transform: [{ scale: badgePulseAnim }] }
              ]}>
                <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.bookedText}>Réservé</Text>
              </Animated.View>
            )}
          </View>

          {classItem.description && (
            <Text style={styles.classDescription}>{classItem.description}</Text>
          )}

          <View style={styles.classDetails}>
            <View style={styles.detailItem}>
              <LinearGradient
                colors={['#6C63FF15', '#6C63FF05']}
                style={styles.detailIconContainer}
              >
                <MaterialIcons name="access-time" size={16} color="#6C63FF" />
              </LinearGradient>
              <Text style={styles.detailText}>
                {classItem.start_time} - {classItem.end_time}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <LinearGradient
                colors={['#F59E0B15', '#F59E0B05']}
                style={styles.detailIconContainer}
              >
                <MaterialIcons name="group" size={16} color="#F59E0B" />
              </LinearGradient>
              <Text style={styles.detailText}>Max {classItem.max_capacity}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={styles.actionButtonContainer}
          >
            <LinearGradient
              colors={booked 
                ? ['#EF4444', '#DC2626']
                : ['#6C63FF', '#4C51BF']
              }
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons 
                name={booked ? 'cancel' : 'event-available'} 
                size={18} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {booked ? 'Annuler' : 'Réserver'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  )
}

// ==================== DAY SECTION HEADER ====================
const DayHeader = ({ day, dayName, color, icon }: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View 
      style={[
        styles.dayHeaderContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.dayHeaderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={[styles.dayIconContainer, { backgroundColor: `${color}30` }]}>
          <MaterialIcons name={icon as any} size={24} color={color} />
        </View>
        <Text style={[styles.dayTitle, { color }]}>{dayName}</Text>
        <View style={[styles.dayDot, { backgroundColor: color }]} />
      </LinearGradient>
    </Animated.View>
  )
}

// ==================== EMPTY STATE ====================
const EmptyState = () => {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(108, 99, 255, 0.1)', 'rgba(76, 81, 191, 0.05)']}
        style={styles.emptyGradient}
      >
        <Animated.View style={[
          styles.emptyIconContainer,
          { transform: [{ translateY: floatAnim }] }
        ]}>
          <MaterialIcons name="event-busy" size={64} color="#6C63FF" />
        </Animated.View>
        <Text style={styles.emptyTitle}>Pas de cours disponibles</Text>
        <Text style={styles.emptySubtitle}>
          Les cours apparaîtront ici dès qu'ils seront programmés
        </Text>
      </LinearGradient>
    </View>
  )
}

export default function ScheduleScreen() {
  const [classes, setClasses] = useState<Class[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const headerAnim = useRef(new Animated.Value(0)).current
  const statsAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadData()
    
    // Animations d'entrée
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchClasses(),
        fetchBookings(),
      ])
    } catch (error) {
      console.error('Load Schedule Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          coach:profiles!coach_id(full_name)
        `)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Fetch Classes Error:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      if (error) throw error
      console.log('Bookings fetched:', data?.length || 0)
      setBookings(data || [])
    } catch (error) {
      console.error('Fetch Bookings Error:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await loadData()
    setRefreshing(false)
  }

  const isBooked = (classId: string, targetDate?: string) => {
    if (targetDate) {
      return bookings.some(b => 
        b.class_id === classId && 
        b.booking_date === targetDate &&
        b.status === 'confirmed'
      )
    }
    return bookings.some(b => b.class_id === classId && b.status === 'confirmed')
  }

  const handleBookClass = async (classItem: Class) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté')
        return
      }

      if (isBooked(classItem.id)) {
        Alert.alert('Déjà réservé', 'Vous avez déjà réservé ce cours')
        return
      }

      // Validation des données requises
      if (!classItem.id || !classItem.start_time || classItem.day_of_week === undefined) {
        Alert.alert('Erreur', 'Informations de cours invalides')
        return
      }

      // Calculer la prochaine date pour ce jour de la semaine
      const today = new Date()
      const currentDay = today.getDay() // 0 = Dimanche, 1 = Lundi, etc.
      const targetDay = classItem.day_of_week
      
      let daysUntilClass = targetDay - currentDay
      if (daysUntilClass < 0) {
        daysUntilClass += 7 // Semaine suivante si le jour est déjà passé
      } else if (daysUntilClass === 0) {
        // Si c'est le même jour, vérifier l'heure
        const [hours, minutes] = classItem.start_time.split(':').map(Number)
        const classTime = new Date(today)
        classTime.setHours(hours, minutes, 0, 0)
        
        if (today > classTime) {
          daysUntilClass = 7 // Prendre la semaine suivante si l'heure est passée
        }
      }
      
      const bookingDate = new Date(today)
      bookingDate.setDate(today.getDate() + daysUntilClass)
      bookingDate.setHours(0, 0, 0, 0) // Reset time to avoid timezone issues
      const bookingDateString = bookingDate.toISOString().split('T')[0]

      // Vérifier si déjà réservé pour cette date spécifique
      if (isBooked(classItem.id, bookingDateString)) {
        Alert.alert('Déjà réservé', `Vous avez déjà réservé ce cours pour le ${bookingDateString}`)
        return
      }

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            class_id: classItem.id,
            booking_date: bookingDateString, // Format YYYY-MM-DD
            status: 'confirmed',
          }
        ])

      if (error) throw error

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      Alert.alert('✅ Réservation confirmée', `Vous êtes inscrit au cours ${classItem.name}`)
      await fetchBookings()
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Erreur', error.message || 'Impossible de réserver')
      console.error('Book Class Error:', error)
    }
  }

  const handleCancelBooking = async (classItem: Class) => {
    try {
      const booking = bookings.find(b => b.class_id === classItem.id)
      if (!booking) return

      Alert.alert(
        'Annuler la réservation',
        `Voulez-vous annuler votre réservation pour ${classItem.name} ?`,
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('bookings')
                  .update({ status: 'cancelled' })
                  .eq('id', booking.id)

                if (error) throw error

                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                Alert.alert('Annulé', 'Votre réservation a été annulée')
                await fetchBookings()
              } catch (error: any) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                Alert.alert('Erreur', error.message || 'Impossible d\'annuler')
                console.error('Cancel Booking Error:', error)
              }
            },
          },
        ]
      )
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler')
      console.error('Cancel Booking Error:', error)
    }
  }

  const getDayIcon = (day: number) => {
    const icons = ['filter-7', 'looks-one', 'looks-two', 'looks-3', 'looks-4', 'looks-5', 'looks-6']
    return icons[day] || 'event'
  }

  const getDayColor = (day: number) => {
    const colors = ['#EC4899', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    return colors[day] || '#6C63FF'
  }

  const groupedClasses = classes.reduce((acc, classItem) => {
    const day = classItem.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(classItem)
    return acc
  }, {} as { [key: number]: Class[] })

  const daysOrder = [1, 2, 3, 4, 5, 6, 0]
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  const totalBookings = bookings.length
  const totalClasses = classes.length

  if (loading) {
    return <AnimatedLoading />
  }

  const headerTranslate = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  })

  const statsTranslate = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.15 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(15,23,42,0.5)', 'rgba(15,23,42,0.2)']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslate }],
          }
        ]}>
          <LinearGradient
            colors={['#6C63FF', '#4C51BF']}
            style={styles.headerIconContainer}
          >
            <MaterialIcons name="event" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Planning des cours</Text>
          <Text style={styles.headerSubtitle}>Réservez vos sessions avec nos coachs</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[
          styles.statsContainer,
          {
            opacity: statsAnim,
            transform: [{ translateY: statsTranslate }],
          }
        ]}>
          <LinearGradient colors={['#6C63FF', '#4C51BF']} style={styles.statCard}>
            <MaterialIcons name="event-available" size={24} color="#fff" />
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Mes réservations</Text>
          </LinearGradient>

          <LinearGradient colors={['#10B981', '#059669']} style={styles.statCard}>
            <MaterialIcons name="fitness-center" size={24} color="#fff" />
            <Text style={styles.statValue}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Cours disponibles</Text>
          </LinearGradient>
        </Animated.View>

        {/* Cours par jour */}
        {daysOrder.map(day => {
          const dayClasses = groupedClasses[day]
          if (!dayClasses || dayClasses.length === 0) return null

          return (
            <View key={day} style={styles.daySection}>
              <DayHeader
                day={day}
                dayName={dayNames[day]}
                color={getDayColor(day)}
                icon={getDayIcon(day)}
              />

              {dayClasses.map((classItem, index) => (
                <AnimatedClassCard
                  key={classItem.id}
                  classItem={classItem}
                  booked={isBooked(classItem.id)}
                  onBook={() => handleBookClass(classItem)}
                  onCancel={() => handleCancelBooking(classItem)}
                  index={index}
                />
              ))}
            </View>
          )
        })}

        {classes.length === 0 && <EmptyState />}
      </ScrollView>
    </ImageBackground>
  )
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: '#B8C1EC',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: '#B8C1EC',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },

  // Day Section
  daySection: {
    marginBottom: Spacing.xl,
  },
  dayHeaderContainer: {
    marginBottom: Spacing.md,
  },
  dayHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  dayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Class Card
  classCardContainer: {
    marginBottom: Spacing.md,
  },
  classCardBlur: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  classCard: {
    padding: Spacing.lg,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instructor: {
    fontSize: FontSize.sm,
    color: '#64748B',
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bookedText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  classDescription: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  classDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: FontSize.sm,
    color: '#0F172A',
    fontWeight: '500',
  },
  actionButtonContainer: {
    marginTop: Spacing.sm,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    padding: Spacing.xxl,
  },
  emptyGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: '#B8C1EC',
    textAlign: 'center',
  },
})
