import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LogIn, LogOut, AlertCircle, ShieldX } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import type { AccessLog } from '@/types'

const MAX_ITEMS = 20

const eventConfig = {
  ENTRY: { label: 'Entrada', icon: LogIn, color: 'text-green-600', bg: 'bg-green-50' },
  EXIT: { label: 'Saída', icon: LogOut, color: 'text-blue-600', bg: 'bg-blue-50' },
  UNKNOWN_CARD: { label: 'Cartão desconhecido', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  BLOCKED_CARD: { label: 'Cartão bloqueado', icon: ShieldX, color: 'text-red-600', bg: 'bg-red-50' },
}

export function LiveAccessFeed() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    const handler = (log: AccessLog) => {
      setLogs((prev) => [log, ...prev].slice(0, MAX_ITEMS))
    }

    socket.on('access:new', handler)
    return () => { socket.off('access:new', handler) }
  }, [socket])

  if (logs.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-sm">Aguardando eventos de acesso em tempo real...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const cfg = eventConfig[log.eventType]
        const Icon = cfg.icon
        return (
          <div
            key={log.id}
            className={`flex items-center gap-4 p-3 rounded-lg ${cfg.bg} animate-pulse-once`}
          >
            <div className={`${cfg.color} flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {log.client?.name ?? `UID: ${log.cardUid}`}
              </p>
              <p className="text-xs text-gray-500">
                {log.device?.name ?? 'Dispositivo desconhecido'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              <p className="text-xs text-gray-400">
                {format(new Date(log.occurredAt), 'HH:mm:ss', { locale: ptBR })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
