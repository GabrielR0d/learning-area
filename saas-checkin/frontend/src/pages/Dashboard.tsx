import { useQuery } from '@tanstack/react-query'
import { Users, CreditCard, MonitorSmart, LogIn, LogOut, AlertCircle } from 'lucide-react'
import { getSummary, getDailyReport } from '@/api/access-logs.api'
import { LiveAccessFeed } from '@/components/access-logs/LiveAccessFeed'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ['summary'], queryFn: getSummary, refetchInterval: 30000 })
  const { data: daily } = useQuery({ queryKey: ['daily'], queryFn: getDailyReport })

  const chartData = daily?.map((d) => ({
    ...d,
    date: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
  })) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Clientes ativos" value={summary?.totalClients ?? 0} color="bg-blue-500" />
        <StatCard icon={CreditCard} label="Cartões ativos" value={summary?.totalCards ?? 0} color="bg-purple-500" />
        <StatCard icon={MonitorSmart} label="Leitores online" value={summary?.totalDevices ?? 0} color="bg-green-500" />
        <StatCard icon={LogIn} label="Entradas hoje" value={summary?.todayEntries ?? 0} color="bg-emerald-500" />
        <StatCard icon={LogOut} label="Saídas hoje" value={summary?.todayExits ?? 0} color="bg-orange-500" />
        <StatCard icon={AlertCircle} label="Cartões desconhecidos" value={summary?.unknownCards ?? 0} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Acessos (últimos 30 dias)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="entries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="entries" name="Entradas" stroke="#10b981" fill="url(#entries)" strokeWidth={2} />
              <Area type="monotone" dataKey="exits" name="Saídas" stroke="#3b82f6" fill="url(#exits)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Eventos em tempo real</h2>
          <LiveAccessFeed />
        </div>
      </div>
    </div>
  )
}
