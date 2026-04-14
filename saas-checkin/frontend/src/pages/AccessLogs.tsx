import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LogIn, LogOut, AlertCircle, ShieldX, MessageCircle, Download } from 'lucide-react'
import { getAccessLogs } from '@/api/access-logs.api'
import { useAuthStore } from '@/stores/auth.store'

const eventConfig = {
  ENTRY: { label: 'Entrada', icon: LogIn, color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  EXIT: { label: 'Saída', icon: LogOut, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  UNKNOWN_CARD: { label: 'Desconhecido', icon: AlertCircle, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  BLOCKED_CARD: { label: 'Bloqueado', icon: ShieldX, color: 'text-red-600', badge: 'bg-red-100 text-red-700' },
}

export function AccessLogs() {
  const [page, setPage] = useState(1)
  const [eventType, setEventType] = useState('')
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isLoading } = useQuery({
    queryKey: ['access-logs', page, eventType],
    queryFn: () => getAccessLogs({ page, limit: 25, ...(eventType && { eventType }) }),
  })

  function exportCsv() {
    const params = new URLSearchParams()
    if (eventType) params.set('eventType', eventType)
    const url = `/api/v1/reports/export/csv?${params}`
    // Use hidden link to send auth header via token in URL workaround is not ideal
    // Better: backend supports token in query param for file downloads
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registros de Acesso</h1>
        <div className="flex gap-2">
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <Download size={15} /> Exportar CSV
        </button>
        <select
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todos os eventos</option>
          <option value="ENTRY">Entradas</option>
          <option value="EXIT">Saídas</option>
          <option value="UNKNOWN_CARD">Cartão desconhecido</option>
          <option value="BLOCKED_CARD">Cartão bloqueado</option>
        </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Evento</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Cartão UID</th>
                <th className="px-4 py-3 text-left">Dispositivo</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((log) => {
                const cfg = eventConfig[log.eventType]
                const Icon = cfg.icon
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{log.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{log.cardUid}</td>
                    <td className="px-4 py-3 text-gray-500">{log.device?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {log.whatsappSent
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><MessageCircle size={12} /> Enviado</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {format(new Date(log.occurredAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Anterior</button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {data.meta.totalPages}</span>
          <button disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Próximo</button>
        </div>
      )}
    </div>
  )
}
