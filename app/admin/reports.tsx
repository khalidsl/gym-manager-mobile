import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'

const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F77F00',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
}

const { width: screenWidth } = Dimensions.get('window')

export default function AdminReports() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulation d'une requête API
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  // Données simulées pour les graphiques
  const weeklyData = [
    { day: 'Lun', visits: 85, revenue: 1240 },
    { day: 'Mar', visits: 92, revenue: 1380 },
    { day: 'Mer', visits: 78, revenue: 1150 },
    { day: 'Jeu', visits: 105, revenue: 1570 },
    { day: 'Ven', visits: 118, revenue: 1890 },
    { day: 'Sam', visits: 145, revenue: 2340 },
    { day: 'Dim', visits: 134, revenue: 2120 },
  ]

  const membershipStats = [
    { type: 'Premium', count: 52, percentage: 34, color: COLORS.primary },
    { type: 'Standard', count: 68, percentage: 45, color: COLORS.accent },
    { type: 'Basic', count: 32, percentage: 21, color: COLORS.secondary },
  ]

  const peakHoursData = [
    { hour: '06:00', usage: 15 },
    { hour: '08:00', usage: 45 },
    { hour: '10:00', usage: 30 },
    { hour: '12:00', usage: 25 },
    { hour: '14:00', usage: 40 },
    { hour: '16:00', usage: 35 },
    { hour: '18:00', usage: 85 },
    { hour: '20:00', usage: 95 },
    { hour: '22:00', usage: 20 },
  ]

  const getMaxValue = (data: any[], key: string) => {
    return Math.max(...data.map(item => item[key]))
  }

  const SimpleBarChart = ({ data, dataKey, label, color }: {
    data: any[]
    dataKey: string
    label: string
    color: string
  }) => {
    const maxValue = getMaxValue(data, dataKey)
    const chartWidth = screenWidth - 80

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{label}</Text>
        <View style={styles.chartArea}>
          {data.map((item, index) => {
            const barHeight = (item[dataKey] / maxValue) * 100
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: `${barHeight}%`,
                        backgroundColor: color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{item[Object.keys(item)[0]]}</Text>
                <Text style={styles.barValue}>{item[dataKey]}</Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  const StatCard = ({ title, value, icon, color, change, changeType }: {
    title: string
    value: string | number
    icon: string
    color: string
    change?: string
    changeType?: 'positive' | 'negative'
  }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.surfaceLight]}
        style={styles.statCardGradient}
      >
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={icon as any} size={24} color={color} />
          </View>
          {change && (
            <View style={[
              styles.changeIndicator,
              { backgroundColor: changeType === 'positive' ? COLORS.success : COLORS.danger }
            ]}>
              <MaterialIcons 
                name={changeType === 'positive' ? 'trending-up' : 'trending-down'} 
                size={12} 
                color="#fff" 
              />
              <Text style={styles.changeText}>{change}</Text>
            </View>
          )}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  )

  const MembershipPieChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Répartition des Abonnements</Text>
      <View style={styles.pieChartContainer}>
        {membershipStats.map((stat, index) => (
          <View key={index} style={styles.membershipItem}>
            <View style={styles.membershipItemLeft}>
              <View style={[styles.membershipColor, { backgroundColor: stat.color }]} />
              <Text style={styles.membershipType}>{stat.type}</Text>
            </View>
            <View style={styles.membershipItemRight}>
              <Text style={styles.membershipCount}>{stat.count}</Text>
              <Text style={styles.membershipPercentage}>{stat.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )

  const QuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Actions Rapides</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { label: 'Export PDF', icon: 'picture-as-pdf', color: COLORS.danger },
          { label: 'Export Excel', icon: 'table-chart', color: COLORS.success },
          { label: 'Rapport Email', icon: 'mail', color: COLORS.secondary },
          { label: 'Imprimer', icon: 'print', color: COLORS.textMuted },
        ].map((action, index) => (
          <TouchableOpacity key={index} style={styles.actionButton} activeOpacity={0.7}>
            <LinearGradient
              colors={[action.color + '20', action.color + '10']}
              style={styles.actionButtonGradient}
            >
              <MaterialIcons name={action.icon as any} size={24} color={action.color} />
              <Text style={[styles.actionButtonText, { color: action.color }]}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filtres de période */}
        <View style={styles.periodFilter}>
          {[
            { key: 'day', label: 'Jour' },
            { key: 'week', label: 'Semaine' },
            { key: 'month', label: 'Mois' },
            { key: 'year', label: 'Année' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodChip,
                selectedPeriod === period.key && styles.periodChipActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Revenus Totaux"
            value="€15,420"
            icon="euro-symbol"
            color={COLORS.success}
            change="+12%"
            changeType="positive"
          />
          <StatCard
            title="Nouveaux Membres"
            value="23"
            icon="person-add"
            color={COLORS.primary}
            change="+8%"
            changeType="positive"
          />
          <StatCard
            title="Taux de Fréquentation"
            value="78%"
            icon="trending-up"
            color={COLORS.accent}
            change="-2%"
            changeType="negative"
          />
          <StatCard
            title="Cours Dispensés"
            value="145"
            icon="event"
            color={COLORS.secondary}
            change="+15%"
            changeType="positive"
          />
        </View>

        {/* Graphique des visites hebdomadaires */}
        <SimpleBarChart
          data={weeklyData}
          dataKey="visits"
          label="Visites Hebdomadaires"
          color={COLORS.primary}
        />

        {/* Graphique des revenus */}
        <SimpleBarChart
          data={weeklyData}
          dataKey="revenue"
          label="Revenus Hebdomadaires (€)"
          color={COLORS.success}
        />

        {/* Heures de pointe */}
        <SimpleBarChart
          data={peakHoursData}
          dataKey="usage"
          label="Heures de Pointe"
          color={COLORS.accent}
        />

        {/* Répartition des abonnements */}
        <MembershipPieChart />

        {/* Actions rapides */}
        <QuickActions />

        {/* Espace supplémentaire en bas */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Filtres période
  periodFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Statistiques principales
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 55) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardGradient: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Graphiques
  chartContainer: {
    margin: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 40,
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 25,
    borderRadius: 4,
    minHeight: 5,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Pie Chart (Memberships)
  pieChartContainer: {
    gap: 12,
  },
  membershipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  membershipItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  membershipColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  membershipType: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  membershipItemRight: {
    alignItems: 'flex-end',
  },
  membershipCount: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  membershipPercentage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Actions rapides
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  actionButton: {
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
//   placeholderText: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 24,
//   },
// })