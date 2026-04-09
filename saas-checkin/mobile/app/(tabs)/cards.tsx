import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, Modal, Alert, ActivityIndicator, Platform,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager'
import { getCards, createCard, updateCard, getClients } from '@/api'
import { COLORS } from '@/constants'
import type { Card, Client } from '@/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: COLORS.success },
  BLOCKED: { label: 'Bloqueado', color: '#ef4444' },
  LOST: { label: 'Perdido', color: '#f59e0b' },
}

export default function CardsScreen() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [form, setForm] = useState({ uid: '', label: '', clientId: '' })
  const [isScanning, setIsScanning] = useState(false)
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    NfcManager.isSupported().then(supported => {
      setNfcSupported(supported)
      if (supported) NfcManager.start()
    })
    return () => { NfcManager.cancelTechnologyRequest().catch(() => {}) }
  }, [])

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cards', search],
    queryFn: () => getCards({ search, limit: 50 }),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ limit: 200 }),
  })

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? updateCard(editing.id, { label: form.label, clientId: form.clientId || undefined })
      : createCard({ uid: form.uid, label: form.label, clientId: form.clientId || undefined }),
    onSuccess: () => {
      setShowForm(false)
      setForm({ uid: '', label: '', clientId: '' })
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['cards'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar.'),
  })

  async function scanNfc() {
    if (!nfcSupported) {
      Alert.alert('NFC', 'NFC não disponível neste dispositivo.')
      return
    }
    setIsScanning(true)
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef)
      const tag = await NfcManager.getTag()
      const uid = tag?.id
        ? tag.id.split(':').join('').toUpperCase()
        : tag?.ndefMessage?.[0]
          ? Ndef.text.decodePayload(tag.ndefMessage[0].payload as unknown as Uint8Array)
          : null
      if (uid) {
        setForm(f => ({ ...f, uid }))
      } else {
        Alert.alert('NFC', 'Não foi possível ler o UID do cartão.')
      }
    } catch {
      // user cancelled or error — silent
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {})
      setIsScanning(false)
    }
  }

  function openEdit(card: Card) {
    setEditing(card)
    setForm({ uid: card.uid, label: card.label ?? '', clientId: card.clientId ?? '' })
    setShowForm(true)
  }

  function openNew() {
    setEditing(null)
    setForm({ uid: '', label: '', clientId: '' })
    setShowForm(true)
  }

  function renderCard({ item }: { item: Card }) {
    const st = STATUS_LABELS[item.status]
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={styles.cardIcon}>
          <Ionicons name="card" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardUid}>{item.label || item.uid}</Text>
          {item.label && <Text style={styles.cardUidSub}>{item.uid}</Text>}
          {item.client ? (
            <Text style={styles.cardClient}>
              <Ionicons name="person" size={11} color={COLORS.gray400} /> {item.client.name}
            </Text>
          ) : (
            <Text style={[styles.cardClient, { color: COLORS.gray300 }]}>Sem cliente</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const clients: Client[] = (clientsData as any)?.data ?? []

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por UID ou nome..."
          placeholderTextColor={COLORS.gray400}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={(data as any)?.data ?? []}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="card-outline" size={40} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Nenhum cartão encontrado</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar cartão' : 'Novo cartão'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          {/* UID row */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>UID do Cartão *</Text>
            <View style={styles.uidRow}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                value={form.uid}
                onChangeText={v => setForm(f => ({ ...f, uid: v.toUpperCase() }))}
                placeholder="Ex: A1B2C3D4"
                placeholderTextColor={COLORS.gray400}
                autoCapitalize="characters"
                editable={!editing}
              />
              {!editing && (
                <TouchableOpacity
                  style={[styles.nfcBtn, isScanning && { opacity: 0.6 }]}
                  onPress={scanNfc}
                  disabled={isScanning}
                >
                  {isScanning
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Ionicons name="wifi" size={20} color={COLORS.white} />
                  }
                </TouchableOpacity>
              )}
            </View>
            {isScanning && (
              <Text style={styles.scanHint}>Aproxime o cartão do leitor NFC...</Text>
            )}
          </View>

          {/* Label */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Apelido</Text>
            <TextInput
              style={styles.formInput}
              value={form.label}
              onChangeText={v => setForm(f => ({ ...f, label: v }))}
              placeholder="Ex: Cartão Azul"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Client picker */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Vincular a cliente</Text>
            <View style={styles.clientList}>
              <TouchableOpacity
                style={[styles.clientOption, !form.clientId && styles.clientOptionActive]}
                onPress={() => setForm(f => ({ ...f, clientId: '' }))}
              >
                <Text style={[styles.clientOptionText, !form.clientId && styles.clientOptionTextActive]}>
                  Nenhum
                </Text>
              </TouchableOpacity>
              {clients.slice(0, 20).map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.clientOption, form.clientId === c.id && styles.clientOptionActive]}
                  onPress={() => setForm(f => ({ ...f, clientId: c.id }))}
                >
                  <Text style={[styles.clientOptionText, form.clientId === c.id && styles.clientOptionTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.6 }]}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.saveBtnText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, margin: 12, borderRadius: 12,
    paddingHorizontal: 14, height: 46,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gray900 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardUid: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  cardUidSub: { fontSize: 11, color: COLORS.gray400, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 1 },
  cardClient: { fontSize: 12, color: COLORS.gray500, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: COLORS.gray400, fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  modal: { flex: 1, padding: 24, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  formInput: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12,
    paddingHorizontal: 14, height: 48, fontSize: 15, color: COLORS.gray900,
  },
  uidRow: { flexDirection: 'row', gap: 8 },
  nfcBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scanHint: { fontSize: 12, color: COLORS.primary, marginTop: 6 },
  clientList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  clientOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100, borderWidth: 1.5, borderColor: 'transparent' },
  clientOptionActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  clientOptionText: { fontSize: 13, color: COLORS.gray600 },
  clientOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
