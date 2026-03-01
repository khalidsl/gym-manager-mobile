import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../services/supabase'

const { width: screenWidth } = Dimensions.get('window')

const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F77F00',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  purple: '#8B5CF6',
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReportData {
  // Stat cards
  totalMembers: number
  activeMembers: number
  expiredMembers: number
  newMembersThisPeriod: number
  totalMachines: number
  availableMachines: number
  totalAccessThisPeriod: number
  estimatedRevenue: number

  // Charts
  accessByDay: { label: string; value: number }[]
  peakHours: { label: string; value: number }[]
  membershipDistribution: { type: string; count: number; color: string }[]
  machineStatusDistribution: { label: string; count: number; color: string }[]
}

const EMPTY_DATA: ReportData = {
  totalMembers: 0,
  activeMembers: 0,
  expiredMembers: 0,
  newMembersThisPeriod: 0,
  totalMachines: 0,
  availableMachines: 0,
  totalAccessThisPeriod: 0,
  estimatedRevenue: 0,
  accessByDay: [],
  peakHours: [],
  membershipDistribution: [],
  machineStatusDistribution: [],
}

const PERIOD_OPTIONS = [
  { key: 'week', label: 'Semaine', days: 7 },
  { key: 'month', label: 'Mois', days: 30 },
  { key: 'quarter', label: 'Trimestre', days: 90 },
  { key: 'year', label: 'Année', days: 365 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).slice(0, 5)
}

function getHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}h`
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [data, setData] = useState<ReportData>(EMPTY_DATA)

  const loadData = useCallback(async (period: string) => {
    setLoading(true)
    try {
      const days = PERIOD_OPTIONS.find(p => p.key === period)?.days ?? 7
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // ── Parallel queries ────────────────────────────────────────────────────
      const [
        profilesRes,
        membershipsRes,
        machinesRes,
        accessLogsRes,
        newMembersRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, role', { count: 'exact' }),
        supabase.from('memberships').select('type, status'),
        supabase.from('machines').select('status'),
        supabase.from('access_logs').select('timestamp, type').gte('timestamp', since),
        supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', since),
      ])

      const profiles = profilesRes.data || []
      const memberships = membershipsRes.data || []
      const machines = machinesRes.data || []
      const accessLogs = accessLogsRes.data || []
      const newMembersCount = newMembersRes.count ?? 0

      // ── Stat cards ──────────────────────────────────────────────────────────
      const totalMembers = profiles.length
      const activeMembers = memberships.filter(m => m.status === 'active').length
      const expiredMembers = memberships.filter(m => m.status === 'expired').length
      const totalMachines = machines.length
      const availableMachines = machines.filter(m => m.status === 'available').length

      // Revenue: basic=30€, premium=50€, vip=80€
      const PRICES: Record<string, number> = { basic: 30, premium: 50, vip: 80 }
      const estimatedRevenue = memberships
        .filter(m => m.status === 'active')
        .reduce((sum, m) => sum + (PRICES[m.type] ?? 45), 0)

      // ── Access by day ───────────────────────────────────────────────────────
      const dayMap: Record<string, number> = {}
      // Generate all days in period
      for (let i = Math.min(days - 1, 13); i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        dayMap[key] = 0
      }
      accessLogs.forEach(log => {
        const key = (log.timestamp ?? '').split('T')[0]
        if (key in dayMap) dayMap[key] = (dayMap[key] || 0) + 1
      })
      const accessByDay = Object.entries(dayMap).map(([date, value]) => ({
        label: getDayLabel(date),
        value,
      }))

      // ── Peak hours ──────────────────────────────────────────────────────────
      const hourMap: Record<number, number> = {}
      for (let h = 6; h <= 22; h += 2) hourMap[h] = 0
      accessLogs.forEach(log => {
        if (!log.timestamp) return
        const h = new Date(log.timestamp).getHours()
        const bucket = Math.floor(h / 2) * 2
        if (bucket in hourMap) hourMap[bucket] = (hourMap[bucket] || 0) + 1
      })
      const peakHours = Object.entries(hourMap).map(([h, value]) => ({
        label: getHourLabel(Number(h)),
        value,
      }))

      // ── Membership distribution ─────────────────────────────────────────────
      const mTypeMap: Record<string, number> = { basic: 0, premium: 0, vip: 0 }
      memberships.filter(m => m.status === 'active').forEach(m => {
        if (m.type in mTypeMap) mTypeMap[m.type]++
      })
      const membershipDistribution = [
        { type: 'Basic', count: mTypeMap.basic, color: COLORS.secondary },
        { type: 'Premium', count: mTypeMap.premium, color: COLORS.primary },
        { type: 'VIP', count: mTypeMap.vip, color: COLORS.warning },
      ].filter(x => x.count > 0)

      // ── Machine status ──────────────────────────────────────────────────────
      const machineStatusDistribution = [
        {
          label: 'Disponible',
          count: machines.filter(m => m.status === 'available').length,
          color: COLORS.success,
        },
        {
          label: 'En usage',
          count: machines.filter(m => m.status === 'in_use').length,
          color: COLORS.primary,
        },
        {
          label: 'Maintenance',
          count: machines.filter(m => m.status === 'maintenance').length,
          color: COLORS.danger,
        },
      ].filter(x => x.count > 0)

      setData({
        totalMembers,
        activeMembers,
        expiredMembers,
        newMembersThisPeriod: newMembersCount,
        totalMachines,
        availableMachines,
        totalAccessThisPeriod: accessLogs.length,
        estimatedRevenue,
        accessByDay,
        peakHours,
        membershipDistribution,
        machineStatusDistribution,
      })
    } catch (e) {
      console.error('Reports load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(selectedPeriod)
  }, [selectedPeriod, loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData(selectedPeriod)
    setRefreshing(false)
  }

  // ── Sub-components ─────────────────────────────────────────────────────────

  /** Top stat card */
  const StatCard = ({
    title, value, icon, color, subtitle,
  }: {
    title: string; value: string | number; icon: string; color: string; subtitle?: string
  }) => (
    <View style={styles.statCard}>
      <LinearGradient colors={[COLORS.surface, COLORS.surfaceLight]} style={styles.statCardGradient}>
        <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
          <MaterialIcons name={icon as any} size={26} color={color} />
        </View>
        <Text style={styles.statValue}>{loading ? '—' : value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  )

  /** Horizontal bar chart */
  const BarChart = ({
    data: chartData, title, color,
  }: {
    data: { label: string; value: number }[]; title: string; color: string
  }) => {
    const maxVal = Math.max(...chartData.map(d => d.value), 1)
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        {chartData.length === 0 ? (
          <Text style={styles.emptyChart}>Aucune donnée sur cette période</Text>
        ) : (
          <View style={styles.barsContainer}>
            {chartData.map((item, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barRowLabel}>{item.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round((item.value / maxVal) * 100)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barRowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  /** Donut-style distribution list */
  const DistributionCard = ({
    title, items, icon,
  }: {
    title: string
    icon: string
    items: { label: string; count: number; color: string }[]
  }) => {
    const total = items.reduce((s, i) => s + i.count, 0)
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <MaterialIcons name={icon as any} size={20} color={COLORS.primary} />
          <Text style={styles.chartTitle}>{title}</Text>
        </View>
        {items.length === 0 || total === 0 ? (
          <Text style={styles.emptyChart}>Aucune donnée disponible</Text>
        ) : (
          <>
            {/* Bar segments */}
            <View style={styles.segmentBar}>
              {items.map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    {
                      flex: item.count / total,
                      backgroundColor: item.color,
                      borderTopLeftRadius: i === 0 ? 6 : 0,
                      borderBottomLeftRadius: i === 0 ? 6 : 0,
                      borderTopRightRadius: i === items.length - 1 ? 6 : 0,
                      borderBottomRightRadius: i === items.length - 1 ? 6 : 0,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              {items.map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>
                    {item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const periodDays = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.days ?? 7

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period Filter ── */}
        <View style={styles.periodFilterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodFilter}>
            {PERIOD_OPTIONS.map(period => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodChip,
                  selectedPeriod === period.key && styles.periodChipActive,
                ]}
                onPress={() => setSelectedPeriod(period.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period.key && styles.periodTextActive,
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des rapports...</Text>
          </View>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Membres Totaux"
                value={data.totalMembers}
                icon="people"
                color={COLORS.primary}
              />
              <StatCard
                title="Membres Actifs"
                value={data.activeMembers}
                icon="person"
                color={COLORS.success}
                subtitle={data.totalMembers > 0
                  ? `${Math.round((data.activeMembers / data.totalMembers) * 100)}% du total`
                  : undefined}
              />
              <StatCard
                title="Nouvelles Inscriptions"
                value={data.newMembersThisPeriod}
                icon="person-add"
                color={COLORS.accent}
                subtitle={`Sur ${periodDays} jours`}
              />
              <StatCard
                title="Revenus Estimés"
                value={`${data.estimatedRevenue.toLocaleString('fr-FR')} €`}
                icon="euro-symbol"
                color={COLORS.warning}
                subtitle="Abonnements actifs"
              />
              <StatCard
                title="Accès Enregistrés"
                value={data.totalAccessThisPeriod}
                icon="door-front"
                color={COLORS.purple}
                subtitle={`Sur ${periodDays} jours`}
              />
              <StatCard
                title="Machines Dispo"
                value={`${data.availableMachines} / ${data.totalMachines}`}
                icon="fitness-center"
                color={COLORS.secondary}
              />
            </View>

            {/* ── Access by day ── */}
            <Text style={styles.sectionTitle}>Accès par Jour</Text>
            <BarChart
              data={data.accessByDay}
              title={`Entrées/Sorties — ${PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}`}
              color={COLORS.primary}
            />

            {/* ── Peak Hours ── */}
            <Text style={styles.sectionTitle}>Heures de Pointe</Text>
            <BarChart
              data={data.peakHours}
              title="Fréquentation par tranche horaire"
              color={COLORS.accent}
            />

            {/* ── Membership Distribution ── */}
            <Text style={styles.sectionTitle}>Abonnements</Text>
            <DistributionCard
              title="Répartition des Abonnements Actifs"
              icon="card-membership"
              items={data.membershipDistribution.map(m => ({
                label: m.type,
                count: m.count,
                color: m.color,
              }))}
            />

            {/* ── Machine Status ── */}
            <Text style={styles.sectionTitle}>État des Machines</Text>
            <DistributionCard
              title="Statut des Équipements"
              icon="fitness-center"
              items={data.machineStatusDistribution.map(m => ({
                label: m.label,
                count: m.count,
                color: m.color,
              }))}
            />

            {/* ── Summary banner ── */}
            <View style={styles.summaryBanner}>
              <LinearGradient
                colors={[COLORS.primary + '20', COLORS.accent + '20']}
                style={styles.summaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="info-outline" size={20} color={COLORS.accent} />
                <Text style={styles.summaryText}>
                  Rapport généré en temps réel depuis Supabase.
                  Revenus estimés à partir des tarifs (Basic 30€ · Premium 50€ · VIP 80€/mois).
                </Text>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Period filter
  periodFilterWrap: {
    paddingVertical: 12,
  },
  periodFilter: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
  },
  periodChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary + '25',
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

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // Stat cards grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  statCardGradient: {
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Bar charts
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyChart: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  barsContainer: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barRowLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 36,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 4,
  },
  barRowValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },

  // Distribution card
  segmentBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
    gap: 2,
  },
  segment: {
    height: '100%',
  },
  legendContainer: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // Summary banner
  summaryBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
})