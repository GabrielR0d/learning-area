import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wifi, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

function useSlugCheck(slug: string) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  async function check(value: string) {
    if (!value || value.length < 3) { setAvailable(null); return }
    setChecking(true)
    try {
      const res = await axios.get(`/api/v1/auth/check-slug?slug=${value}`)
      setAvailable(res.data.available)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  return { available, checking, check }
}

export function Signup() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const { available, checking, check } = useSlugCheck('')

  const [form, setForm] = useState({
    companyName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  function handleSlugChange(value: string) {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    setForm((f) => ({ ...f, slug: sanitized }))
    check(sanitized)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (available === false) {
      toast.error('Este slug já está em uso.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/v1/auth/signup', form)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      toast.success(`Bem-vindo, ${res.data.user.name}!`)
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Wifi className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta grátis</h1>
          <p className="text-gray-500 text-sm mt-1">Comece em 30 segundos, sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome da empresa</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="Minha Academia"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Slug (URL da sua conta)
            </label>
            <div className="relative">
              <input
                required
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="minha-academia"
                className={`w-full border rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  available === false ? 'border-red-400' : available === true ? 'border-green-400' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 size={14} className="animate-spin text-gray-400" />}
                {!checking && available === true && <CheckCircle size={14} className="text-green-500" />}
                {!checking && available === false && <XCircle size={14} className="text-red-500" />}
              </span>
            </div>
            {available === false && <p className="text-xs text-red-500 mt-1">Slug já em uso</p>}
            {available === true && <p className="text-xs text-green-600 mt-1">Disponível!</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Seu nome</label>
            <input
              required
              value={form.adminName}
              onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
              placeholder="João Silva"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
              placeholder="joao@empresa.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Senha (min. 8 caracteres)</label>
            <input
              required
              type="password"
              minLength={8}
              value={form.adminPassword}
              onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || available === false}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Criar conta grátis
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <strong>Plano Grátis inclui:</strong> 1 dispositivo, 50 clientes, notificações WhatsApp
        </div>
      </div>
    </div>
  )
}
