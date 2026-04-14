import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useAuthStore } from '@/stores/auth.store'
import { COLORS } from '@/constants'
import api from '@/api/client'

interface TenantSettings {
  notifyOnEntry: boolean
  notifyOnExit: boolean
  notifyOnUnknown: boolean
  whatsappProvider: string | null
  whatsappInstanceId: string | null
  whatsappToken: string | null
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [waToken, setWaToken] = useState('')
  const [waInstance, setWaInstance] = useState('')
  const [showWaForm, setShowWaForm] = useState(false)

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get<TenantSettings>('/settings').then(r => r.data),
    onSuccess: (d: TenantSettings) => {
      setWaInstance(d.whatsappInstanceId ?? '')
      setWaToken(d.whatsappToken ?? '')
    },
  } as any)

  const toggleMutation = useMutation({
    mutationFn: (patch: Partial<TenantSettings>) =>
      api.patch('/settings', patch).then(r => r.data),
    onSuccess: () => refetch(),
    onError: () => Alert.alert('Erro', 'Não foi possível salvar.'),
  })

  const waMutation = useMutation({
    mutationFn: () =>
      api.patch('/settings', {
        whatsappProvider: 'EVOLUTION',
        whatsappInstanceId: waInstance,
        whatsappToken: waToken,
      }).then(r => r.data),
    onSuccess: () => {
      Alert.alert('Sucesso', 'WhatsApp configurado!')
      setShowWaForm(false)
      refetch()
    },
    onError: () => Alert.alert('Erro', 'Não foi possível salvar.'),
  })

  async function requestPushPermission() {
    setPushLoading(true)
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status === 'granted') {
        setPushEnabled(true)
        const token = await Notifications.getExpoPushTokenAsync()
        await api.patch('/settings/push-token', { token: token.data })
        Alert.alert('Notificações', 'Notificações push ativadas!')
      } else {
        Alert.alert('Notificações', 'Permissão negada.')
      }
    } finally {
      setPushLoading(false)
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>
      </View>

      {/* Notifications section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="phone-portrait-outline" size={20} color={COLORS.gray600} />
            <View>
              <Text style={styles.rowLabel}>Push no celular</Text>
              <Text style={styles.rowSub}>Receber alertas em tempo real</Text>
            </View>
          </View>
          {pushLoading
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <Switch
                value={pushEnabled}
                onValueChange={v => v ? requestPushPermission() : setPushEnabled(false)}
                trackColor={{ true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
          }
        </View>

        <View style={styles.divider} />

        {([
          { key: 'notifyOnEntry', label: 'Entradas', sub: 'WhatsApp ao entrar', icon: 'log-in-outline' },
          { key: 'notifyOnExit', label: 'Saídas', sub: 'WhatsApp ao sair', icon: 'log-out-outline' },
          { key: 'notifyOnUnknown', label: 'Cartões desconhecidos', sub: 'Alerta para cartões não cadastrados', icon: 'warning-outline' },
        ] as const).map(({ key, label, sub, icon }) => (
          <View key={key} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={icon} size={20} color={COLORS.gray600} />
              <View>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowSub}>{sub}</Text>
              </View>
            </View>
            <Switch
              value={!!(settings as any)?.[key]}
              onValueChange={v => toggleMutation.mutate({ [key]: v })}
              trackColor={{ true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        ))}
      </View>

      {/* WhatsApp section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WhatsApp</Text>

        <View style={styles.waStatus}>
          <View style={[styles.waDot, { backgroundColor: settings?.whatsappInstanceId ? COLORS.success : COLORS.gray300 }]} />
          <Text style={styles.waStatusText}>
            {settings?.whatsappInstanceId ? `Instância: ${settings.whatsappInstanceId}` : 'Não configurado'}
          </Text>
          <TouchableOpacity onPress={() => setShowWaForm(!showWaForm)} style={styles.waEditBtn}>
            <Ionicons name="pencil" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {showWaForm && (
          <View style={styles.waForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Instance ID</Text>
              <TextInput
                style={styles.formInput}
                value={waInstance}
                onChangeText={setWaInstance}
                placeholder="minha-instancia"
                placeholderTextColor={COLORS.gray400}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>API Token</Text>
              <TextInput
                style={styles.formInput}
                value={waToken}
                onChangeText={setWaToken}
                placeholder="••••••••"
                placeholderTextColor={COLORS.gray400}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, waMutation.isPending && { opacity: 0.6 }]}
              onPress={() => waMutation.mutate()}
              disabled={waMutation.isPending}
            >
              {waMutation.isPending
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.saveBtnText}>Salvar configuração</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* About section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.gray600} />
            <Text style={styles.rowLabel}>Versão</Text>
          </View>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Encerrar sessão</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  userEmail: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  roleBadge: { marginTop: 4, backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  roleText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  section: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: COLORS.gray900 },
  rowSub: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  rowValue: { fontSize: 14, color: COLORS.gray500 },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 4 },
  waStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  waDot: { width: 8, height: 8, borderRadius: 4 },
  waStatusText: { flex: 1, fontSize: 14, color: COLORS.gray700 },
  waEditBtn: { padding: 4 },
  waForm: { marginTop: 8 },
  formGroup: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, marginBottom: 5 },
  formInput: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 12, height: 44, fontSize: 14, color: COLORS.gray900,
  },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 10, height: 46, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 4, padding: 16,
    backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  gray300: COLORS.gray300 ?? '#d1d5db',
  gray600: COLORS.gray600 ?? '#4b5563',
})
