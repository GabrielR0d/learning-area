import { useState, useEffect, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import api from '@/api/client'

interface WhatsAppConfig {
  provider: 'EVOLUTION' | 'ZAPI'
  instanceName: string
  baseUrl: string
  isConnected: boolean
}

interface TenantSettings {
  notifyClientOnEntry: boolean
  notifyClientOnExit: boolean
  notifyAdminOnEntry: boolean
  adminPhoneNumber: string
  entryMessageTemplate: string
  exitMessageTemplate: string
  timezone: string
}

export function Settings() {
  const qc = useQueryClient()
  const { data: settings } = useQuery<TenantSettings>({ queryKey: ['settings'], queryFn: () => api.get('/settings').then(r => r.data) })
  const { data: waStatus, refetch: refetchStatus } = useQuery({ queryKey: ['wa-status'], queryFn: () => api.get('/whatsapp/status').then(r => r.data) })

  const [form, setForm] = useState<Partial<TenantSettings>>({})
  const [waForm, setWaForm] = useState({ provider: 'EVOLUTION', instanceName: '', baseUrl: '', apiKey: '' })
  const [testPhone, setTestPhone] = useState('')

  useEffect(() => { if (settings) setForm(settings) }, [settings])

  const saveSettings = useMutation({
    mutationFn: (data: Partial<TenantSettings>) => api.put('/settings', data).then(r => r.data),
    onSuccess: () => { toast.success('Configurações salvas'); qc.invalidateQueries({ queryKey: ['settings'] }) },
  })

  const saveWa = useMutation({
    mutationFn: (data: typeof waForm) => api.put('/whatsapp/config', data).then(r => r.data),
    onSuccess: () => { toast.success('WhatsApp configurado'); refetchStatus() },
  })

  const testWa = useMutation({
    mutationFn: () => api.post('/whatsapp/test', { phone: testPhone }).then(r => r.data),
    onSuccess: () => toast.success('Mensagem de teste enviada!'),
    onError: () => toast.error('Falha ao enviar mensagem'),
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Notificações WhatsApp</h2>

        {[
          { key: 'notifyClientOnEntry', label: 'Notificar cliente na entrada' },
          { key: 'notifyClientOnExit', label: 'Notificar cliente na saída' },
          { key: 'notifyAdminOnEntry', label: 'Notificar admin na entrada' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Telefone do admin (com DDI)</label>
          <input value={form.adminPhoneNumber ?? ''} onChange={(e) => setForm(f => ({ ...f, adminPhoneNumber: e.target.value }))} placeholder="5511999999999" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mensagem de entrada</label>
          <textarea rows={2} value={form.entryMessageTemplate ?? ''} onChange={(e) => setForm(f => ({ ...f, entryMessageTemplate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">Variáveis: {'{nome}'}, {'{data}'}, {'{hora}'}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mensagem de saída</label>
          <textarea rows={2} value={form.exitMessageTemplate ?? ''} onChange={(e) => setForm(f => ({ ...f, exitMessageTemplate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button onClick={() => saveSettings.mutate(form)} disabled={saveSettings.isPending} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
          <Save size={15} /> Salvar configurações
        </button>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Conexão WhatsApp</h2>
          <div className="flex items-center gap-2">
            {waStatus?.connected
              ? <span className="flex items-center gap-1 text-green-600 text-sm"><Wifi size={15} /> Conectado</span>
              : <span className="flex items-center gap-1 text-red-500 text-sm"><WifiOff size={15} /> Desconectado</span>
            }
            <button onClick={() => refetchStatus()} className="text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { key: 'baseUrl', label: 'URL da Evolution API', placeholder: 'http://localhost:8080' },
            { key: 'instanceName', label: 'Nome da instância', placeholder: 'minha-empresa' },
            { key: 'apiKey', label: 'API Key da instância', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={key === 'apiKey' ? 'password' : 'text'}
                value={(waForm as any)[key]}
                onChange={(e) => setWaForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button onClick={() => saveWa.mutate(waForm)} disabled={saveWa.isPending} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
          <Save size={15} /> Salvar conexão WhatsApp
        </button>

        <div className="border-t pt-4 flex gap-2">
          <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="5511999999999" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
          <button onClick={() => testWa.mutate()} disabled={testWa.isPending || !testPhone} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 disabled:opacity-60">
            Testar envio
          </button>
        </div>
      </div>
    </div>
  )
}
