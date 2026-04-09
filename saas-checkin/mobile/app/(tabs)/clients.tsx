import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getClients, createClient, updateClient } from '@/api'
import { COLORS } from '@/constants'
import type { Client } from '@/types'

export default function ClientsScreen() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const qc = useQueryClient()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients({ search, limit: 50 }),
  })

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? updateClient(editing.id, form)
      : createClient(form),
    onSuccess: () => {
      setShowForm(false)
      setForm({ name: '', phone: '', email: '' })
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar.'),
  })

  function openEdit(client: Client) {
    setEditing(client)
    setForm({ name: client.name, phone: client.phone, email: client.email ?? '' })
    setShowForm(true)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', phone: '', email: '' })
    setShowForm(true)
  }

  function renderClient({ item }: { item: Client }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientPhone}>{item.phone}</Text>
          {item.email ? <Text style={styles.clientEmail}>{item.email}</Text> : null}
        </View>
        <View style={styles.cardRight}>
          {item.cards && item.cards.length > 0 && (
            <View style={styles.cardBadge}>
              <Ionicons name="card" size={12} color={COLORS.primary} />
              <Text style={styles.cardBadgeText}>{item.cards.length}</Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? COLORS.success : COLORS.gray300 }]} />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou telefone..."
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
          data={data?.data ?? []}
          keyExtractor={item => item.id}
          renderItem={renderClient}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
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
            <Text style={styles.modalTitle}>{editing ? 'Editar cliente' : 'Novo cliente'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          {[
            { key: 'name', label: 'Nome *', placeholder: 'João Silva', keyboard: 'default' },
            { key: 'phone', label: 'Telefone *', placeholder: '5511999999999', keyboard: 'phone-pad' },
            { key: 'email', label: 'Email', placeholder: 'joao@email.com', keyboard: 'email-address' },
          ].map(({ key, label, placeholder, keyboard }) => (
            <View key={key} style={styles.formGroup}>
              <Text style={styles.formLabel}>{label}</Text>
              <TextInput
                style={styles.formInput}
                value={(form as any)[key]}
                onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray400}
                keyboardType={keyboard as any}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}

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
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  clientPhone: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  clientEmail: { fontSize: 12, color: COLORS.gray400 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  cardBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  gray300: '#d1d5db',
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
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
