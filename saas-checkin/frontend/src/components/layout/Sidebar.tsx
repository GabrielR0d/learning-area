import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MonitorSmart,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/devices', icon: MonitorSmart, label: 'Dispositivos' },
  { to: '/access-logs', icon: ClipboardList, label: 'Registros' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Wifi className="text-blue-400" size={24} />
          <span className="font-bold text-lg">CheckIn RFID</span>
        </div>
        <p className="text-gray-400 text-xs mt-1 truncate">{user?.name}</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-t border-gray-700"
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  )
}
