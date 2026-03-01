import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../services/supabase'

const { width: W } = Dimensions.get('window')

const C = {
  primary: '#FF6B35',
  accent: '#F77F00',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  purple: '#8B5CF6',
  blue: '#06B6D4',
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Stats {
  totalMembers: number
  activeMembers: number
  expiredMembers: number
  suspendedMembers: number
  totalMachines: number
  availableMachines: number
  inUseMachines: number
  maintenanceMachines: number
  todayAccess: number
  estimatedRevenue: number
}

interface Activity {
  id: string
  icon: string
  color: string
  title: string
  subtitle: string
  time: string
}

const INIT_STATS: Stats = {
  totalMembers: 0, activeMembers: 0, expiredMembers: 0, suspendedMembers: 0,
  totalMachines: 0, availableMachines: 0, inUseMachines: 0, maintenanceMachines: 0,
  todayAccess: 0, estimatedRevenue: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>(INIT_STATS)
  const [activities, setActivities] = useState<Activity[]>([])

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    loadAll()
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const [
        membershipsRes,
        machinesRes,
        accessRes,
        recentProfilesRes,
        recentMachinesRes,
        recentAccessRes,
      ] = await Promise.all([
        supabase.from('memberships').select('type, status'),
        supabase.from('machines').select('status'),
        supabase
          .from('access_logs')
          .select('id', { count: 'exact', head: true })
          .gte('timestamp', `${today}T00:00:00Z`),
        supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('machines')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('access_logs')
          .select('id, type, timestamp, member_id')
          .order('timestamp', { ascending: false })
          .limit(4),
      ])

      const memberships = membershipsRes.data ?? []
      const machines = machinesRes.data ?? []

      // Stats
      const active = memberships.filter(m => m.status === 'active').length
      const expired = memberships.filter(m => m.status === 'expired').length
      const suspended = memberships.filter(m => m.status === 'suspended').length

      const PRICES: Record<string, number> = { basic: 30, premium: 50, vip: 80 }
      const revenue = memberships
        .filter(m => m.status === 'active')
        .reduce((s, m) => s + (PRICES[m.type] ?? 45), 0)

      setStats({
        totalMembers: memberships.length,
        activeMembers: active,
        expiredMembers: expired,
        suspendedMembers: suspended,
        totalMachines: machines.length,
        availableMachines: machines.filter(m => m.status === 'available').length,
        inUseMachines: machines.filter(m => m.status === 'in_use').length,
        maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
        todayAccess: accessRes.count ?? 0,
        estimatedRevenue: revenue,
      })

      // Activities feed
      const acts: Activity[] = []

        ; (recentProfilesRes.data ?? []).forEach(p => {
          acts.push({
            id: `m_${p.id}`,
            icon: 'person-add',
            color: C.success,
            title: 'Nouveau membre inscrit',
            subtitle: p.full_name ?? 'Inconnu',
            time: p.created_at,
          })
        })

        ; (recentMachinesRes.data ?? []).forEach(m => {
          acts.push({
            id: `mach_${m.id}`,
            icon: 'fitness-center',
            color: C.purple,
            title: 'Machine ajoutée',
            subtitle: m.name,
            time: m.created_at,
          })
        })

        ; (recentAccessRes.data ?? []).forEach(a => {
          acts.push({
            id: `a_${a.id}`,
            icon: a.type === 'entry' ? 'login' : 'logout',
            color: a.type === 'entry' ? C.blue : C.warning,
            title: a.type === 'entry' ? 'Entrée enregistrée' : 'Sortie enregistrée',
            subtitle: `ID: ${String(a.member_id ?? '').substring(0, 8)}...`,
            time: a.timestamp ?? new Date().toISOString(),
          })
        })

      acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setActivities(acts.slice(0, 8))
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  // ── Sub-components ────────────────────────────────────────────────────────

  /** Animated stat card */
  const StatCard = ({
    label, value, icon, gradient, sub,
  }: {
    label: string; value: string | number; icon: string
    gradient: [string, string]; sub?: string
  }) => (
    <TouchableOpacity activeOpacity={0.85} style={styles.statCard}>
      <LinearGradient colors={gradient} style={styles.statCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.statCardTop}>
          <View style={styles.statIconCircle}>
            <MaterialIcons name={icon as any} size={22} color="#fff" />
          </View>
          {!!sub && (
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{sub}</Text>
            </View>
          )}
        </View>
        <Text style={styles.statValue}>{loading ? '—' : value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  /** Mini progress bar for membership breakdown */
  const MemberPill = ({ label, count, total, color }: {
    label: string; count: number; total: number; color: string
  }) => (
    <View style={styles.memberPillRow}>
      <View style={[styles.memberPillDot, { backgroundColor: color }]} />
      <Text style={styles.memberPillLabel}>{label}</Text>
      <View style={styles.memberPillBarBg}>
        <View
          style={[
            styles.memberPillBarFill,
            { width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.memberPillCount}>{count}</Text>
    </View>
  )

  // Active rate
  const activeRate = stats.totalMembers > 0
    ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
    : 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={[C.background, C.surface]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.primary} colors={[C.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Header ── */}
          <LinearGradient
            colors={[C.primary + '30', C.accent + '10']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.adminTitle}>Administrateur 👋</Text>
              <Text style={styles.dateLabel}>{todayLabel()}</Text>
            </View>
            <LinearGradient colors={[C.primary, C.accent]} style={styles.headerAvatar}>
              <MaterialIcons name="admin-panel-settings" size={28} color="#fff" />
            </LinearGradient>
          </LinearGradient>

          {/* ── Today summary strip ── */}
          <View style={styles.todayStrip}>
            <View style={styles.todayItem}>
              <Text style={styles.todayVal}>{loading ? '—' : stats.todayAccess}</Text>
              <Text style={styles.todayLbl}>Accès aujourd'hui</Text>
            </View>
            <View style={styles.todaySep} />
            <View style={styles.todayItem}>
              <Text style={styles.todayVal}>{loading ? '—' : stats.activeMembers}</Text>
              <Text style={styles.todayLbl}>Membres actifs</Text>
            </View>
            <View style={styles.todaySep} />
            <View style={styles.todayItem}>
              <Text style={[styles.todayVal, { color: C.success }]}>
                {loading ? '—' : `${stats.estimatedRevenue.toLocaleString('fr-FR')} €`}
              </Text>
              <Text style={styles.todayLbl}>Revenus estimés</Text>
            </View>
          </View>

          {/* ── Stats Grid ── */}
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Membres"
              value={stats.totalMembers}
              icon="group"
              gradient={[C.primary, C.accent]}
            />
            <StatCard
              label="Membres Actifs"
              value={stats.activeMembers}
              icon="person"
              gradient={[C.success, '#059669']}
              sub={`${activeRate}%`}
            />
            <StatCard
              label="Total Machines"
              value={stats.totalMachines}
              icon="fitness-center"
              gradient={[C.purple, '#7C3AED']}
            />
            <StatCard
              label="Machines Dispo"
              value={stats.availableMachines}
              icon="check-circle"
              gradient={[C.blue, '#0284C7']}
            />
            <StatCard
              label="En Maintenance"
              value={stats.maintenanceMachines}
              icon="build"
              gradient={[C.warning, '#D97706']}
            />
            <StatCard
              label="Expirés"
              value={stats.expiredMembers}
              icon="person-off"
              gradient={[C.danger, '#DC2626']}
            />
          </View>

          {/* ── Membership breakdown ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="people" size={20} color={C.primary} />
              <Text style={styles.cardTitle}>État des Abonnements</Text>
            </View>

            <MemberPill label="Actifs" count={stats.activeMembers} total={stats.totalMembers} color={C.success} />
            <MemberPill label="Expirés" count={stats.expiredMembers} total={stats.totalMembers} color={C.danger} />
            <MemberPill label="Suspendus" count={stats.suspendedMembers} total={stats.totalMembers} color={C.warning} />

            {/* Active rate bar */}
            <View style={styles.activeRateRow}>
              <Text style={styles.activeRateLabel}>Taux d'activité</Text>
              <Text style={[styles.activeRateVal, { color: activeRate > 70 ? C.success : activeRate > 40 ? C.warning : C.danger }]}>
                {activeRate}%
              </Text>
            </View>
            <View style={styles.activeRateBarBg}>
              <View style={[
                styles.activeRateBarFill,
                {
                  width: `${activeRate}%`,
                  backgroundColor: activeRate > 70 ? C.success : activeRate > 40 ? C.warning : C.danger,
                },
              ]} />
            </View>
          </View>

          {/* ── Machine status ── */}
          <View style={[styles.card, styles.cardRow]}>
            <View style={styles.machineStatItem}>
              <LinearGradient colors={[C.success + '30', C.success + '10']} style={styles.machineStatIcon}>
                <MaterialIcons name="check-circle" size={24} color={C.success} />
              </LinearGradient>
              <Text style={styles.machineStatVal}>{stats.availableMachines}</Text>
              <Text style={styles.machineStatLbl}>Disponibles</Text>
            </View>
            <View style={styles.machineStatSep} />
            <View style={styles.machineStatItem}>
              <LinearGradient colors={[C.blue + '30', C.blue + '10']} style={styles.machineStatIcon}>
                <MaterialIcons name="play-circle-filled" size={24} color={C.blue} />
              </LinearGradient>
              <Text style={styles.machineStatVal}>{stats.inUseMachines}</Text>
              <Text style={styles.machineStatLbl}>En usage</Text>
            </View>
            <View style={styles.machineStatSep} />
            <View style={styles.machineStatItem}>
              <LinearGradient colors={[C.danger + '30', C.danger + '10']} style={styles.machineStatIcon}>
                <MaterialIcons name="build" size={24} color={C.danger} />
              </LinearGradient>
              <Text style={styles.machineStatVal}>{stats.maintenanceMachines}</Text>
              <Text style={styles.machineStatLbl}>Maintenance</Text>
            </View>
          </View>

          {/* ── Recent Activity ── */}
          <Text style={styles.sectionTitle}>Activité Récente</Text>
          <View style={styles.card}>
            {loading ? (
              <View style={styles.activityLoading}>
                <MaterialIcons name="hourglass-empty" size={32} color={C.textMuted} />
                <Text style={styles.activityLoadingText}>Chargement...</Text>
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.activityLoading}>
                <MaterialIcons name="inbox" size={40} color={C.textMuted} />
                <Text style={styles.activityLoadingText}>Aucune activité récente</Text>
              </View>
            ) : (
              activities.map((act, i) => (
                <View key={act.id}>
                  <View style={styles.activityRow}>
                    <View style={[styles.activityIconWrap, { backgroundColor: act.color + '25' }]}>
                      <MaterialIcons name={act.icon as any} size={20} color={act.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activitySub}>{act.subtitle}</Text>
                    </View>
                    <Text style={styles.activityTime}>{timeAgo(act.time)}</Text>
                  </View>
                  {i < activities.length - 1 ? <View style={styles.activityDivider} /> : null}
                </View>
              ))
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </LinearGradient>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
  adminTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, marginTop: 2 },
  dateLabel: { fontSize: 12, color: C.textMuted, marginTop: 4, textTransform: 'capitalize' },
  headerAvatar: {
    width: 58, height: 58, borderRadius: 29,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // Today strip
  todayStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.surfaceLight,
  },
  todayItem: { flex: 1, alignItems: 'center' },
  todaySep: { width: 1, backgroundColor: C.surfaceLight },
  todayVal: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  todayLbl: { fontSize: 11, color: C.textMuted, marginTop: 3, textAlign: 'center' },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 6,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (W - 44) / 2,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardInner: { padding: 18, minHeight: 110 },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statIconCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  statBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '500' },

  // Card
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.surfaceLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },

  // Member pills
  memberPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  memberPillDot: { width: 10, height: 10, borderRadius: 5 },
  memberPillLabel: { fontSize: 13, color: C.textSecondary, width: 68 },
  memberPillBarBg: {
    flex: 1, height: 7, backgroundColor: C.surfaceLight,
    borderRadius: 4, overflow: 'hidden',
  },
  memberPillBarFill: { height: '100%', borderRadius: 4, minWidth: 4 },
  memberPillCount: { fontSize: 13, fontWeight: '700', color: C.textPrimary, width: 28, textAlign: 'right' },

  activeRateRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 16, marginBottom: 6,
  },
  activeRateLabel: { fontSize: 13, color: C.textSecondary },
  activeRateVal: { fontSize: 16, fontWeight: '800' },
  activeRateBarBg: {
    height: 8, backgroundColor: C.surfaceLight,
    borderRadius: 4, overflow: 'hidden',
  },
  activeRateBarFill: { height: '100%', borderRadius: 4 },

  // Machine status
  machineStatItem: { flex: 1, alignItems: 'center', gap: 8 },
  machineStatSep: { width: 1, height: 60, backgroundColor: C.surfaceLight },
  machineStatIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  machineStatVal: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  machineStatLbl: { fontSize: 11, color: C.textMuted, textAlign: 'center' },

  // Activity
  activityLoading: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 30, gap: 10,
  },
  activityLoadingText: { fontSize: 14, color: C.textMuted },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  activityIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  activitySub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 11, color: C.textMuted, textAlign: 'right', maxWidth: 70 },
  activityDivider: { height: 1, backgroundColor: C.surfaceLight },
})