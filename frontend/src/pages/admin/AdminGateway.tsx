import { useEffect, useState } from 'react'
import {
  CreditCard, Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Save, Loader2, Landmark, Banknote, Zap, Leaf,
} from 'lucide-react'
import toast from 'react-hot-toast'

type GatewayTipo = 'manual' | 'stripe' | 'asaas' | 'pagseguro' | 'abacatepay'
type Ambiente = 'sandbox' | 'producao'

interface ProviderConfig {
  chave_publica: string
  chave_secreta: string
  webhook_secret: string
  ambiente: Ambiente
}

const EMPTY_CONFIG = (): ProviderConfig => ({
  chave_publica: '',
  chave_secreta: '',
  webhook_secret: '',
  ambiente: 'sandbox',
})

const GATEWAYS = [
  { id: 'manual' as GatewayTipo, nome: 'Manual', descricao: 'Registre pagamentos manualmente sem integração', icon: Banknote, cor: 'text-slate-400' },
  { id: 'stripe' as GatewayTipo, nome: 'Stripe', descricao: 'Gateway internacional com cartão e PIX', icon: CreditCard, cor: 'text-blue-400' },
  { id: 'asaas' as GatewayTipo, nome: 'Asaas', descricao: 'Gateway brasileiro: PIX, boleto e cartão', icon: Zap, cor: 'text-green-400' },
  { id: 'pagseguro' as GatewayTipo, nome: 'PagSeguro', descricao: 'Gateway PagSeguro / PagBank', icon: Landmark, cor: 'text-amber-400' },
  { id: 'abacatepay' as GatewayTipo, nome: 'Abacate Pay', descricao: 'Gateway brasileiro PIX — simples e direto', icon: Leaf, cor: 'text-lime-400' },
]

const WEBHOOK_URL = `${window.location.origin}/api/admin-panel/webhook/gateway/`
const token = () => localStorage.getItem('admin_access_token') || ''

export default function AdminGateway() {
  const [gatewayAtivo, setGatewayAtivo] = useState<GatewayTipo>('manual')
  const [selected, setSelected] = useState<GatewayTipo>('manual')
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({})
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
        const ativo = (data.gateway_ativo || 'manual') as GatewayTipo
        setGatewayAtivo(ativo)
        setSelected(ativo)
        if (data.configs) setConfigs(data.configs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const current = configs[selected] ?? EMPTY_CONFIG()

  const setField = (field: keyof ProviderConfig, value: string) =>
    setConfigs(prev => ({
      ...prev,
      [selected]: { ...(prev[selected] ?? EMPTY_CONFIG()), [field]: value },
    }))

  const handleSelectGateway = (gw: GatewayTipo) => {
    setSelected(gw)
    setMostrarSecreta(false)
    setMostrarWebhook(false)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const r = await fetch('/api/admin-panel/gateway/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: selected, ...current }),
      })
      if (!r.ok) throw new Error()
      setGatewayAtivo(selected)
      toast.success('Configuração salva e gateway ativado!')
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

  const inputCls = 'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder:text-gray-600'

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Gateway de Pagamento</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cada gateway tem suas próprias chaves. Selecione e salve para ativar.
        </p>
      </div>

      {/* Seleção de gateway */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">Gateway Ativo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GATEWAYS.map(gw => {
            const Icon = gw.icon
            const isSelected = selected === gw.id
            const isAtivo = gatewayAtivo === gw.id
            return (
              <button
                key={gw.id}
                onClick={() => handleSelectGateway(gw.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
                }`}
              >
                <Icon size={22} className={isSelected ? 'text-violet-400' : gw.cor} />
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {gw.nome}
                </span>
                <span className="text-xs text-gray-500 leading-tight">{gw.descricao}</span>
                {isAtivo && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle size={10} /> Ativo
                  </span>
                )}
                {isSelected && !isAtivo && (
                  <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                    Editando
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Configurações do provider selecionado */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
        <h2 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          Configurações — {GATEWAYS.find(g => g.id === selected)?.nome}
        </h2>

        {selected === 'manual' ? (
          <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <Banknote size={20} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">Modo Manual</p>
              <p className="text-gray-400 text-sm mt-1">
                Pagamentos registrados manualmente. Nenhuma integração com gateway externo.
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
                  <button key={amb} onClick={() => setField('ambiente', amb)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      current.ambiente === amb
                        ? amb === 'producao' ? 'bg-red-600 text-white' : 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}>
                    {amb === 'sandbox' ? 'Sandbox' : 'Produção'}
                  </button>
                ))}
              </div>
              {current.ambiente === 'producao' && (
                <div className="flex items-center gap-2 mt-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-xs font-medium">
                    Atenção: modo Produção ativo. Cobranças reais serão realizadas.
                  </p>
                </div>
              )}
            </div>

            {/* Chave pública (Stripe e PagSeguro) */}
            {(selected === 'stripe' || selected === 'pagseguro') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chave Pública</label>
                <input type="text" value={current.chave_publica}
                  onChange={e => setField('chave_publica', e.target.value)}
                  placeholder={selected === 'stripe' ? 'pk_test_...' : 'sua-chave-publica'}
                  className={inputCls} />
              </div>
            )}

            {/* Chave secreta / API Key */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {selected === 'asaas' ? 'Access Token' : selected === 'abacatepay' ? 'API Key' : 'Chave Secreta'}
              </label>
              <div className="relative">
                <input
                  type={mostrarSecreta ? 'text' : 'password'}
                  value={current.chave_secreta}
                  onChange={e => setField('chave_secreta', e.target.value)}
                  placeholder={
                    selected === 'stripe' ? 'sk_test_...'
                    : selected === 'asaas' ? '$aas_...'
                    : selected === 'abacatepay' ? 'abc_dev_...'
                    : 'sua-chave-secreta'
                  }
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setMostrarSecreta(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {mostrarSecreta ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Webhook secret */}
            {(selected === 'stripe' || selected === 'pagseguro' || selected === 'abacatepay') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Webhook Secret</label>
                <div className="relative">
                  <input
                    type={mostrarWebhook ? 'text' : 'password'}
                    value={current.webhook_secret}
                    onChange={e => setField('webhook_secret', e.target.value)}
                    placeholder={
                      selected === 'stripe' ? 'whsec_...'
                      : selected === 'abacatepay' ? 'Chave HMAC (opcional)'
                      : 'webhook-secret'
                    }
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setMostrarWebhook(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {mostrarWebhook ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* URL de Webhook */}
      {(selected === 'stripe' || selected === 'abacatepay' || selected === 'pagseguro') && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">URL de Webhook</h2>
          <p className="text-gray-500 text-xs mb-3">
            {selected === 'abacatepay' && <>Registre no painel do <span className="text-gray-300">Abacate Pay → Webhooks</span>:</>}
            {selected === 'stripe' && <>Registre no painel do <span className="text-gray-300">Stripe → Developers → Webhooks</span>:</>}
            {selected === 'pagseguro' && <>Registre no painel do <span className="text-gray-300">PagSeguro → Notificações</span>:</>}
          </p>
          <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
            <code className="text-green-400 text-xs flex-1 break-all font-mono">{WEBHOOK_URL}</code>
            <button onClick={copiarUrl}
              className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              {urlCopiada ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} />}
              {urlCopiada ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Rodapé com status e botão */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Ativo: <span className="text-white font-medium">{GATEWAYS.find(g => g.id === gatewayAtivo)?.nome}</span>
          {selected !== gatewayAtivo && (
            <span className="text-yellow-400 ml-2">
              — salve para ativar {GATEWAYS.find(g => g.id === selected)?.nome}
            </span>
          )}
        </p>
        <button onClick={salvar} disabled={salvando}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {salvando
            ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
            : <><Save size={15} /> Salvar e Ativar</>}
        </button>
      </div>
    </div>
  )
}
