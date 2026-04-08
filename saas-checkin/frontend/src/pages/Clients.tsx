import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { getClients, createClient, updateClient, deleteClient } from '@/api/clients.api'
import type { Client } from '@/types'

export function Clients() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => getClients({ page, limit: 20, search }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => { toast.success('Cliente removido'); qc.invalidateQueries({ queryKey: ['clients'] }) },
  })

  function handleEdit(client: Client) {
    setEditing(client)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Cartões</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.data.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                <td className="px-4 py-3 text-gray-500">{client.phone}</td>
                <td className="px-4 py-3 text-gray-500">{client.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{client.cards?.length ?? 0}</td>
                <td className="px-4 py-3">
                  {client.isActive
                    ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Ativo</span>
                    : <span className="flex items-center gap-1 text-gray-400"><XCircle size={14} /> Inativo</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Remover cliente?')) deleteMutation.mutate(client.id) }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">
            Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {data.meta.totalPages}</span>
          <button disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">
            Próximo
          </button>
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['clients'] }) }}
        />
      )}
    </div>
  )
}

function ClientForm({ client, onClose, onSaved }: {
  client: Client | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    document: client?.document ?? '',
    notes: client?.notes ?? '',
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      client ? updateClient(client.id, data) : createClient(data),
    onSuccess: () => { toast.success(client ? 'Cliente atualizado' : 'Cliente criado'); onSaved() },
    onError: () => toast.error('Erro ao salvar'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{client ? 'Editar cliente' : 'Novo cliente'}</h2>
        <div className="space-y-3">
          {(['name', 'phone', 'email', 'document', 'notes'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
