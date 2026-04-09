import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getSummary, getAccessLogs } from '@/api'
import { useSocket } from '@/hooks/useSocket'
import { COLORS, EVENT_LABELS } from '@/constants'
import type { AccessLog } from '@/types'

const STAT_CARDS = [
  { key: 'totalClients', label: 'Clientes', icon: 'people', color: '#3b82f6' },
  { key: 'totalCards', label: 'Cartões', icon: 'card', color: '#8b5cf6' },
  { key: 'totalDevices', label: 'Leitores', icon: 'hardware-chip', color: '#10b981' },
  { key: 'todayEntries', label: 'Entradas hoje', icon: 'log-in', color: '#059669' },
  { key: 'todayExits', label: 'Saídas hoje', icon: 'log-out', color: '#f59e0b' },
  { key: 'unknownCards', label: 'Desconhecidos', icon: 'warning', color: '#ef4444' },
] as const

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const [liveEvents, setLiveEvents] = useState<AccessLog[]>([])

  const { data: summary, refetch: refetchSummary, isRefetching } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    refetchInterval: 30_000,
  })

  const { data: logsData } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: () => getAccessLogs({ limit: 10 }),
  })

  // Real-time events via Socket.io
  useSocket('access:new', useCallback((log) => {
    setLiveEvents(prev => [log as AccessLog, ...prev].slice(0, 20))
    refetchSummary()
  }, []))

  const displayLogs = liveEvents.length > 0 ? liveEvents : (logsData?.data ?? [])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchSummary} />}
    >
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        {liveEvents.length > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {STAT_CARDS.map(({ key, label, icon, color }) => (
          <View key={key} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{summary?.[key] ?? '—'}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Live Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eventos recentes</Text>
        {displayLogs.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Ionicons name="radio-outline" size={32} color={COLORS.gray200} />
            <Text style={styles.emptyText}>Aguardando eventos...</Text>
          </View>
        ) : (
          displayLogs.map((log, i) => {
            const cfg = EVENT_LABELS[log.eventType]
            return (
              <View key={log.id ?? i} style={[styles.logItem, i === 0 && liveEvents.length > 0 && styles.logItemNew]}>
                <Text style={styles.logEmoji}>{cfg.emoji}</Text>
                <View style={styles.logInfo}>
                  <Text style={styles.logName}>{log.client?.name ?? `UID: ${log.cardUid}`}</Text>
                  <Text style={styles.logDevice}>{log.device?.name ?? 'Dispositivo'}</Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={[styles.logEvent, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.logTime}>
                    {format(new Date(log.occurredAt), 'HH:mm:ss', { locale: ptBR })}
                  </Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray900, flex: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger },
  liveText: { fontSize: 10, fontWeight: '700', color: COLORS.danger },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 20,
  },
  statCard: {
    width: '31%', backgroundColor: COLORS.white,
    borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.gray900 },
  statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, marginBottom: 12 },
  emptyFeed: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: COLORS.gray400, fontSize: 14 },
  logItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  logItemNew: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  logEmoji: { fontSize: 22, marginRight: 12 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  logDevice: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logEvent: { fontSize: 12, fontWeight: '600' },
  logTime: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
})
