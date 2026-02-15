import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, ImageBackground } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
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
  class_id: string
  status: string
}

export default function ScheduleScreen() {
  const [classes, setClasses] = useState<Class[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
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
      setBookings(data || [])
    } catch (error) {
      console.error('Fetch Bookings Error:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const isBooked = (classId: string) => {
    return bookings.some(b => b.class_id === classId)
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

      // Calculer la prochaine date pour ce jour de la semaine
      const today = new Date()
      const currentDay = today.getDay() // 0 = Dimanche, 1 = Lundi, etc.
      const targetDay = classItem.day_of_week
      let daysUntilClass = targetDay - currentDay
      if (daysUntilClass <= 0) daysUntilClass += 7 // Si le cours est déjà passé cette semaine, prendre la semaine suivante
      
      const bookingDate = new Date(today)
      bookingDate.setDate(today.getDate() + daysUntilClass)

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            class_id: classItem.id,
            booking_date: bookingDate.toISOString().split('T')[0], // Format YYYY-MM-DD
            status: 'confirmed',
          }
        ])

      if (error) throw error

      Alert.alert('Réservation confirmée', `Vous êtes inscrit au cours ${classItem.name}`)
      await fetchBookings()
    } catch (error: any) {
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
              const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', booking.id)

              if (error) throw error

              Alert.alert('Annulé', 'Votre réservation a été annulée')
              await fetchBookings()
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

  const daysOrder = [1, 2, 3, 4, 5, 6, 0] // Lundi à Dimanche
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.55 }}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <MaterialIcons name="event" size={32} color="#6C63FF" />
        <Text style={styles.headerTitle}>Planning des cours</Text>
        <Text style={styles.headerSubtitle}>Réservez vos sessions avec nos coachs</Text>
      </View>

      {/* Cours par jour */}
      {daysOrder.map(day => {
        const dayClasses = groupedClasses[day]
        if (!dayClasses || dayClasses.length === 0) return null

        return (
          <View key={day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <MaterialIcons name={getDayIcon(day) as any} size={24} color={getDayColor(day)} />
              <Text style={[styles.dayTitle, { color: getDayColor(day) }]}>
                {dayNames[day]}
              </Text>
            </View>

            {dayClasses.map(classItem => {
              const booked = isBooked(classItem.id)
              
              return (
                <Card key={classItem.id} style={styles.classCard}>
                  <View style={styles.classHeader}>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{classItem.name}</Text>
                      <Text style={styles.instructor}>
                        <MaterialIcons name="person" size={14} />
                        {' '}{(classItem as any).coach?.full_name || 'Coach'}
                      </Text>
                    </View>
                    {booked && (
                      <View style={styles.bookedBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.bookedText}>Réservé</Text>
                      </View>
                    )}
                  </View>

                  {classItem.description && (
                    <Text style={styles.classDescription}>{classItem.description}</Text>
                  )}

                  <View style={styles.classDetails}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="access-time" size={16} color="#6C63FF" />
                      <Text style={styles.detailText}>{classItem.start_time} - {classItem.end_time}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="group" size={16} color="#F59E0B" />
                      <Text style={styles.detailText}>Max {classItem.max_capacity}</Text>
                    </View>
                  </View>

                  {booked ? (
                    <Button
                      title="Annuler la réservation"
                      onPress={() => handleCancelBooking(classItem)}
                      variant="secondary"
                      size="small"
                      style={styles.actionButton}
                    />
                  ) : (
                    <Button
                      title="Réserver"
                      onPress={() => handleBookClass(classItem)}
                      variant="primary"
                      size="small"
                      style={styles.actionButton}
                    />
                  )}
                </Card>
              )
            })}
          </View>
        )
      })}

      {classes.length === 0 && (
        <Card style={styles.emptyCard}>
          <MaterialIcons name="event-busy" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>Aucun cours disponible pour le moment</Text>
        </Card>
      )}
    </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginTop: 4,
  },
  daySection: {
    marginBottom: Spacing.xl,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dayTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  classCard: {
    marginBottom: Spacing.md,
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
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  instructor: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  bookedText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  classDescription: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  classDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
})
