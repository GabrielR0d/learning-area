import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import api from '@/api/client'
import { getClients } from '@/api/clients.api'
import type { Card } from '@/types'

const statusConfig = {
  ACTIVE: { label: 'Ativo', icon: CheckCircle, color: 'text-green-600' },
  BLOCKED: { label: 'Bloqueado', icon: XCircle, color: 'text-red-500' },
  LOST: { label: 'Perdido', icon: AlertTriangle, color: 'text-yellow-500' },
}

export function Cards() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const qc = useQueryClient()

  const { data } = useQuery({ queryKey: ['cards'], queryFn: () => api.get('/cards').then(r => r.data) })
  const { data: clients } = useQuery({ queryKey: ['clients-all'], queryFn: () => getClients({ limit: 200 }) })

  const [form, setForm] = useState({ uid: '', label: '', clientId: '', status: 'ACTIVE' })

  function openEdit(card: Card) {
    setEditing(card)
    setForm({ uid: card.uid, label: card.label ?? '', clientId: card.clientId ?? '', status: card.status })
    setShowForm(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? api.put(`/cards/${editing.id}`, { clientId: form.clientId || null, label: form.label, status: form.status })
      : api.post('/cards', { uid: form.uid, label: form.label, clientId: form.clientId || null }),
    onSuccess: () => {
      toast.success(editing ? 'Cartão atualizado' : 'Cartão cadastrado')
      setShowForm(false)
      setEditing(null)
      setForm({ uid: '', label: '', clientId: '', status: 'ACTIVE' })
      qc.invalidateQueries({ queryKey: ['cards'] })
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cards/${id}`),
    onSuccess: () => { toast.success('Cartão removido'); qc.invalidateQueries({ queryKey: ['cards'] }) },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cartões RFID</h1>
        <button onClick={() => { setEditing(null); setForm({ uid: '', label: '', clientId: '', status: 'ACTIVE' }); setShowForm(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Novo cartão
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">UID</th>
              <th className="px-4 py-3 text-left">Rótulo</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Último uso</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.data?.map((card: Card) => {
              const st = statusConfig[card.status]
              const Icon = st.icon
              return (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700 text-xs">{card.uid}</td>
                  <td className="px-4 py-3 text-gray-600">{card.label ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{card.client?.name ?? <span className="text-gray-300">Sem cliente</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${st.color}`}><Icon size={13} />{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{card.lastSeenAt ? new Date(card.lastSeenAt).toLocaleString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(card)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => { if (confirm('Remover cartão?')) deleteMutation.mutate(card.id) }} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-3">
            <h2 className="text-lg font-semibold">{editing ? 'Editar cartão' : 'Novo cartão'}</h2>
            {!editing && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">UID do cartão</label>
                <input value={form.uid} onChange={(e) => setForm(f => ({ ...f, uid: e.target.value }))} placeholder="A3F2C1B4" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rótulo (opcional)</label>
              <input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Cartão azul" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
              <select value={form.clientId} onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Sem cliente</option>
                {clients?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {editing && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="ACTIVE">Ativo</option>
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="LOST">Perdido</option>
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
