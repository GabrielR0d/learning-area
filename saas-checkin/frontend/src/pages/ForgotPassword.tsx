import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import axios from 'axios'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/v1/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Esqueci minha senha</h1>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm">
              Se o email existir em nossa base, você receberá as instruções em breve.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 text-sm mt-4 hover:underline">
              <ArrowLeft size={14} /> Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Enviar instruções
            </button>
            <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Voltar
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
