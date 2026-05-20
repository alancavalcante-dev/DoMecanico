import { useEffect, useState } from 'react'
import {
  CreditCard, Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Save, Loader2, Landmark, Banknote, Zap, Leaf
} from 'lucide-react'
import toast from 'react-hot-toast'

type GatewayTipo = 'manual' | 'stripe' | 'asaas' | 'pagseguro' | 'abacatepay'
type Ambiente = 'sandbox' | 'producao'

interface GatewayConfig {
  gateway: GatewayTipo
  ambiente: Ambiente
  chave_publica: string
  chave_secreta: string
  webhook_secret: string
  chave_secreta_salva?: boolean
  webhook_secret_salvo?: boolean
}

const GATEWAYS: {
  id: GatewayTipo
  nome: string
  descricao: string
  icon: React.ElementType
  cor: string
}[] = [
  {
    id: 'manual',
    nome: 'Manual',
    descricao: 'Registre pagamentos manualmente sem integração',
    icon: Banknote,
    cor: 'text-slate-400',
  },
  {
    id: 'stripe',
    nome: 'Stripe',
    descricao: 'Gateway internacional com cartão e PIX',
    icon: CreditCard,
    cor: 'text-blue-400',
  },
  {
    id: 'asaas',
    nome: 'Asaas',
    descricao: 'Gateway brasileiro: PIX, boleto e cartão',
    icon: Zap,
    cor: 'text-green-400',
  },
  {
    id: 'pagseguro',
    nome: 'PagSeguro',
    descricao: 'Gateway PagSeguro / PagBank',
    icon: Landmark,
    cor: 'text-amber-400',
  },
  {
    id: 'abacatepay',
    nome: 'Abacate Pay',
    descricao: 'Gateway brasileiro PIX — simples e direto',
    icon: Leaf,
    cor: 'text-lime-400',
  },
]

const WEBHOOK_URL = `${window.location.origin}/api/admin-panel/webhook/gateway/`

const token = () => localStorage.getItem('admin_access_token') || ''

const defaultConfig = (): GatewayConfig => ({
  gateway: 'manual',
  ambiente: 'sandbox',
  chave_publica: '',
  chave_secreta: '',
  webhook_secret: '',
})

export default function AdminGateway() {
  const [config, setConfig] = useState<GatewayConfig>(defaultConfig())
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarSecreta, setMostrarSecreta] = useState(false)
  const [mostrarWebhook, setMostrarWebhook] = useState(false)
  const [urlCopiada, setUrlCopiada] = useState(false)

  useEffect(() => {
    fetch('/api/admin-panel/gateway/', {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => {
        const gw = data.gateway || data.provider
        if (data && gw) {
          setConfig({
            gateway: gw as GatewayTipo,
            ambiente: data.ambiente || 'sandbox',
            chave_publica: data.chave_publica || '',
            chave_secreta: data.chave_secreta || '',
            webhook_secret: data.webhook_secret || '',
            chave_secreta_salva: data.chave_secreta_salva ?? Boolean(data.chave_secreta),
            webhook_secret_salvo: data.webhook_secret_salvo ?? Boolean(data.webhook_secret),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const salvar = async () => {
    setSalvando(true)
    try {
      const r = await fetch('/api/admin-panel/gateway/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      if (!r.ok) throw new Error()
      toast.success('Configuração salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSalvando(false)
    }
  }

  const copiarUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setUrlCopiada(true)
      setTimeout(() => setUrlCopiada(false), 2000)
    })
  }

  const set = (field: keyof GatewayConfig, value: string) =>
    setConfig(prev => ({ ...prev, [field]: value }))

  const inputCls =
    'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder:text-gray-600'

  if (loading) {
    return <div className="text-gray-400 text-sm">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gateway de Pagamento</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure qual gateway usar para processar pagamentos das assinaturas
        </p>
      </div>

      {/* Seleção do gateway */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">
          Gateway Ativo
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GATEWAYS.map(gw => {
            const Icon = gw.icon
            const ativo = config.gateway === gw.id
            return (
              <button
                key={gw.id}
                onClick={() => set('gateway', gw.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  ativo
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
                }`}
              >
                <Icon size={24} className={ativo ? 'text-blue-400' : gw.cor} />
                <span className={`text-sm font-semibold ${ativo ? 'text-white' : 'text-gray-300'}`}>
                  {gw.nome}
                </span>
                <span className="text-xs text-gray-500 leading-tight">{gw.descricao}</span>
                {ativo && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    Selecionado
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-gray-400">
          Configurações
        </h2>

        {config.gateway === 'manual' ? (
          <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <Banknote size={20} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">Modo Manual Ativo</p>
              <p className="text-gray-400 text-sm mt-1">
                Os pagamentos serão registrados manualmente pelo administrador. Nenhuma integração
                com gateway externo será utilizada. Use a aba de Faturas para registrar pagamentos.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ambiente */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Ambiente</label>
              <div className="flex gap-2">
                {(['sandbox', 'producao'] as Ambiente[]).map(amb => (
                  <button
                    key={amb}
                    onClick={() => set('ambiente', amb)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.ambiente === amb
                        ? amb === 'producao'
                          ? 'bg-red-600 text-white'
                          : 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {amb === 'sandbox' ? 'Sandbox' : 'Produção'}
                  </button>
                ))}
              </div>
              {config.ambiente === 'producao' && (
                <div className="flex items-center gap-2 mt-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-xs font-medium">
                    Atenção: modo Produção ativo. Cobranças reais serão realizadas.
                  </p>
                </div>
              )}
            </div>

            {/* Chave pública (Stripe e PagSeguro) */}
            {(config.gateway === 'stripe' || config.gateway === 'pagseguro') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chave Pública</label>
                <input
                  type="text"
                  value={config.chave_publica}
                  onChange={e => set('chave_publica', e.target.value)}
                  placeholder={
                    config.gateway === 'stripe' ? 'pk_test_...' : 'sua-chave-publica'
                  }
                  className={inputCls}
                />
              </div>
            )}

            {/* Chave secreta */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-gray-500">
                  {config.gateway === 'asaas' ? 'Access Token' : config.gateway === 'abacatepay' ? 'API Key' : 'Chave Secreta'}
                </label>
                {config.chave_secreta_salva && !config.chave_secreta && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Salvo
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={mostrarSecreta ? 'text' : 'password'}
                  value={config.chave_secreta}
                  onChange={e => set('chave_secreta', e.target.value)}
                  placeholder={
                    config.chave_secreta_salva
                      ? '(chave salva — deixe em branco para manter)'
                      : config.gateway === 'stripe'
                      ? 'sk_test_...'
                      : config.gateway === 'asaas'
                      ? '$aas_...'
                      : config.gateway === 'abacatepay'
                      ? 'abacate_...'
                      : 'sua-chave-secreta'
                  }
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSecreta(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {mostrarSecreta ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Webhook secret (Stripe, PagSeguro e Abacate Pay) */}
            {(config.gateway === 'stripe' || config.gateway === 'pagseguro' || config.gateway === 'abacatepay') && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs text-gray-500">Webhook Secret</label>
                  {config.webhook_secret_salvo && !config.webhook_secret && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Salvo
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={mostrarWebhook ? 'text' : 'password'}
                    value={config.webhook_secret}
                    onChange={e => set('webhook_secret', e.target.value)}
                    placeholder={
                      config.webhook_secret_salvo
                        ? '(chave salva — deixe em branco para manter)'
                        : config.gateway === 'stripe'
                        ? 'whsec_...'
                        : config.gateway === 'abacatepay'
                        ? 'Chave HMAC do webhook (opcional)'
                        : 'webhook-secret'
                    }
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarWebhook(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {mostrarWebhook ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* URLs de Callback */}
      {(config.gateway === 'stripe' || config.gateway === 'abacatepay' || config.gateway === 'pagseguro') && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
            URL de Webhook
          </h2>
          <p className="text-gray-500 text-xs mb-3">
            {config.gateway === 'stripe' && <>Registre no painel do Stripe em <span className="text-gray-300">Developers → Webhooks</span>:</>}
            {config.gateway === 'abacatepay' && <>Registre no painel do <span className="text-gray-300">Abacate Pay → Webhooks</span>:</>}
            {config.gateway === 'pagseguro' && <>Registre no painel do <span className="text-gray-300">PagSeguro → Notificações</span>:</>}
          </p>
          <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
            <code className="text-green-400 text-xs flex-1 break-all font-mono">{WEBHOOK_URL}</code>
            <button
              onClick={copiarUrl}
              className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {urlCopiada ? (
                <CheckCircle size={15} className="text-green-400" />
              ) : (
                <Copy size={15} />
              )}
              {urlCopiada ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Botão salvar */}
      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {salvando ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save size={15} /> Salvar Configuração
            </>
          )}
        </button>
      </div>
    </div>
  )
}
