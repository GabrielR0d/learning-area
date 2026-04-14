import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getAccessLogs } from '@/api'
import { COLORS, EVENT_LABELS } from '@/constants'
import type { AccessLog } from '@/types'

const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Entradas', value: 'ENTRY' },
  { label: 'Saídas', value: 'EXIT' },
  { label: 'Desconhecidos', value: 'UNKNOWN_CARD' },
]

export default function LogsScreen() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['access-logs', filter, page],
    queryFn: () => getAccessLogs({ page, limit: 30, ...(filter && { eventType: filter }) }),
  })

  function renderLog({ item }: { item: AccessLog }) {
    const cfg = EVENT_LABELS[item.eventType]
    return (
      <View style={styles.logItem}>
        <Text style={styles.emoji}>{cfg.emoji}</Text>
        <View style={styles.logInfo}>
          <Text style={styles.logName}>{item.client?.name ?? `UID: ${item.cardUid}`}</Text>
          <View style={styles.logMeta}>
            <Text style={styles.logDevice}>{item.device?.name ?? 'Dispositivo'}</Text>
            {item.whatsappSent && (
              <View style={styles.waBadge}>
                <Ionicons name="logo-whatsapp" size={10} color="#16a34a" />
              </View>
            )}
          </View>
        </View>
        <View style={styles.logRight}>
          <Text style={[styles.logEvent, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.logTime}>
            {format(new Date(item.occurredAt), "dd/MM HH:mm", { locale: ptBR })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            onPress={() => { setFilter(f.value); setPage(1) }}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={item => item.id}
          renderItem={renderLog}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="list-outline" size={40} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
            </View>
          }
          ListFooterComponent={
            data && data.meta.totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={page === 1}
                  onPress={() => setPage(p => p - 1)}
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                >
                  <Ionicons name="chevron-back" size={16} color={page === 1 ? COLORS.gray300 : COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.pageText}>{page} / {data.meta.totalPages}</Text>
                <TouchableOpacity
                  disabled={page === data.meta.totalPages}
                  onPress={() => setPage(p => p + 1)}
                  style={[styles.pageBtn, page === data.meta.totalPages && styles.pageBtnDisabled]}
                >
                  <Ionicons name="chevron-forward" size={16} color={page === data.meta.totalPages ? COLORS.gray300 : COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  filters: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.gray600 },
  chipTextActive: { color: COLORS.white },
  logItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  emoji: { fontSize: 20, marginRight: 12 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  logDevice: { fontSize: 12, color: COLORS.gray500 },
  waBadge: { backgroundColor: '#dcfce7', padding: 3, borderRadius: 4 },
  logRight: { alignItems: 'flex-end' },
  logEvent: { fontSize: 12, fontWeight: '600' },
  logTime: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: COLORS.gray400, fontSize: 14 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 16 },
  pageBtn: { padding: 8, backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gray200 },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: 14, color: COLORS.gray600 },
  gray300: COLORS.gray200,
  gray600: COLORS.gray500,
})
