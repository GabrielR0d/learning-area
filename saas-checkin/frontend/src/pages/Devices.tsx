import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Wifi, WifiOff, Copy, RefreshCw, Trash2 } from 'lucide-react'
import api from '@/api/client'
import type { Device } from '@/types'

export function Devices() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const qc = useQueryClient()

  const { data: devices } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(r => r.data),
    refetchInterval: 15000,
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/devices', { name, location }).then(r => r.data),
    onSuccess: () => { toast.success('Dispositivo criado'); setShowForm(false); setName(''); setLocation(''); qc.invalidateQueries({ queryKey: ['devices'] }) },
  })

  const rotateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/devices/${id}/regenerate-key`).then(r => r.data),
    onSuccess: (data) => { toast.success(`Nova chave: ${data.apiKey}`); qc.invalidateQueries({ queryKey: ['devices'] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/devices/${id}`),
    onSuccess: () => { toast.success('Dispositivo removido'); qc.invalidateQueries({ queryKey: ['devices'] }) },
  })

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    toast.success('Chave copiada!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dispositivos</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Novo dispositivo
        </button>
      </div>

      <div className="grid gap-4">
        {devices?.map((device) => (
          <div key={device.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${device.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {device.isOnline
                    ? <Wifi size={18} className="text-green-600" />
                    : <WifiOff size={18} className="text-gray-400" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.location ?? 'Sem localização'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => rotateMutation.mutate(device.id)} className="text-gray-400 hover:text-blue-600" title="Regenerar chave">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => { if (confirm('Remover dispositivo?')) deleteMutation.mutate(device.id) }} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <p className="text-xs text-gray-500 font-medium">API Key:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate font-mono">{device.apiKey}</code>
              <button onClick={() => copyKey(device.apiKey)} className="text-gray-400 hover:text-gray-700">
                <Copy size={14} />
              </button>
            </div>

            {device.lastHeartbeat && (
              <p className="text-xs text-gray-400 mt-2">
                Último sinal: {new Date(device.lastHeartbeat).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Novo dispositivo</h2>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Entrada Principal)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localização (ex: Recepção)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
