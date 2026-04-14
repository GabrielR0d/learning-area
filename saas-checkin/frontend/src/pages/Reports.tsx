import { useQuery } from '@tanstack/react-query'
import { getDailyReport, getTopClients } from '@/api/access-logs.api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy } from 'lucide-react'

export function Reports() {
  const { data: daily } = useQuery({ queryKey: ['daily'], queryFn: getDailyReport })
  const { data: topClients } = useQuery({ queryKey: ['top-clients'], queryFn: getTopClients })

  const chartData = daily?.map((d) => ({
    ...d,
    date: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
  })) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Acessos diários (últimos 30 dias)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="entries" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="exits" name="Saídas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" /> Top clientes (últimos 30 dias)
        </h2>
        <div className="space-y-2">
          {topClients?.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-gray-400">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.client?.name ?? 'Desconhecido'}</p>
                <p className="text-xs text-gray-400">{item.client?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.max(20, (item.count / (topClients[0]?.count || 1)) * 120)}px` }} />
                <span className="text-sm font-semibold text-gray-700">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
