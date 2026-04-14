import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, Zap, Loader2 } from 'lucide-react'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'

interface Plan {
  id: string
  name: string
  price: number | null
  limits: { maxClients: number; maxDevices: number; maxCards: number }
  features: string[]
}

export function Plans() {
  const user = useAuthStore((s) => s.user)
  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/billing/plans').then((r) => r.data),
  })

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => api.post('/billing/checkout', { plan }).then((r) => r.data),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: () => toast.error('Erro ao iniciar checkout'),
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-gray-500 text-sm mt-1">Escolha o plano ideal para o seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans?.map((plan) => {
          const isCurrent = false // would compare with tenant plan from API
          const isPopular = plan.id === 'PRO'

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                isPopular ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-gray-200'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={10} /> POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                {plan.price === null ? (
                  <p className="text-2xl font-bold text-gray-900 mt-1">Consultar</p>
                ) : plan.price === 0 ? (
                  <p className="text-2xl font-bold text-gray-900 mt-1">Grátis</p>
                ) : (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">R$</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {' '}{(plan.price / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-gray-500">/mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.price === 0 ? (
                <div className="text-center text-xs text-gray-400 py-2">Plano atual (gratuito)</div>
              ) : plan.price === null ? (
                <a
                  href="mailto:contato@seuapp.com"
                  className="w-full text-center py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  Falar com vendas
                </a>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate(plan.id)}
                  disabled={checkoutMutation.isPending}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-60`}
                >
                  {checkoutMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Assinar {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
