import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Settings, Save, ShieldAlert, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

interface Config {
  bloquear_cadastros: boolean
  bloquear_login: boolean
  bloquear_pagamentos: boolean
  modo_manutencao: boolean
  mensagem_manutencao: string
  banner_homologacao: boolean
  mensagem_banner: string
  push_notifications_ativas: boolean
}

function Toggle({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function AdminConfiguracaoSistema() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    adminAPI.configuracaoSistema()
      .then(r => setConfig(r.data))
      .finally(() => setLoading(false))
  }, [])

  const salvar = async () => {
    if (!config) return
    setSalvando(true)
    try {
      await adminAPI.configuracaoSistemaSalvar(config)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSalvando(false)
    }
  }

  const set = (field: keyof Config, value: boolean | string) =>
    setConfig(c => c ? { ...c, [field]: value } : c)

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>
  if (!config) return null

  const temBloqueioAtivo = config.bloquear_cadastros || config.bloquear_login ||
    config.bloquear_pagamentos || config.modo_manutencao

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} /> Configuração do Sistema
        </h1>
        <p className="text-gray-500 text-sm mt-1">Controle de acesso e modo de operação da plataforma</p>
      </div>

      {temBloqueioAtivo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300 text-sm">
            Um ou mais bloqueios estão <strong>ativos</strong>. Usuários podem estar impedidos de usar a plataforma.
          </p>
        </div>
      )}

      {/* Controles de acesso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-1">Controle de Acesso</h2>
        <p className="text-gray-500 text-xs mb-4">Bloqueie funcionalidades específicas sem derrubar o sistema</p>

        <Toggle
          label="Bloquear Cadastros"
          description="Impede novos usuários de se cadastrarem"
          checked={config.bloquear_cadastros}
          onChange={v => set('bloquear_cadastros', v)}
        />
        <Toggle
          label="Bloquear Login"
          description="Impede usuários existentes de fazer login"
          checked={config.bloquear_login}
          onChange={v => set('bloquear_login', v)}
        />
        <Toggle
          label="Bloquear Pagamentos"
          description="Desativa a geração de links e fluxos de pagamento"
          checked={config.bloquear_pagamentos}
          onChange={v => set('bloquear_pagamentos', v)}
        />
      </div>

      {/* Manutenção */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Modo Manutenção / Mensagem</h2>

        <Toggle
          label="Modo Manutenção"
          description="Exibe a mensagem abaixo em todas as telas de bloqueio"
          checked={config.modo_manutencao}
          onChange={v => set('modo_manutencao', v)}
        />

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Mensagem exibida nos bloqueios</label>
          <textarea
            value={config.mensagem_manutencao}
            onChange={e => set('mensagem_manutencao', e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-violet-500"
            placeholder="Sistema em manutenção. Voltamos em breve."
          />
        </div>
      </div>

      {/* Banner de homologação */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Banner de Homologação</h2>

        <Toggle
          label="Exibir Banner"
          description="Mostra uma faixa de aviso no topo de todas as páginas"
          checked={config.banner_homologacao}
          onChange={v => set('banner_homologacao', v)}
        />

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Texto do banner</label>
          <input
            type="text"
            value={config.mensagem_banner}
            onChange={e => set('mensagem_banner', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            placeholder="Ambiente de homologação — sistema em testes"
          />
        </div>

        {config.banner_homologacao && (
          <div className="bg-amber-500 text-black text-xs font-semibold rounded-lg px-4 py-2 flex items-center justify-center">
            Preview: {config.mensagem_banner || 'Texto do banner'}
          </div>
        )}
      </div>

      {/* Notificações Push */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Bell size={15} /> Notificações Push PWA
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          Quando ativo, admins recebem alertas no navegador ao concluir OS ou aprovar orçamentos
        </p>
        <Toggle
          label="Notificações Push"
          description="Desativar não remove inscrições existentes — apenas para o envio"
          checked={config.push_notifications_ativas}
          onChange={v => set('push_notifications_ativas', v)}
        />
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
      >
        <Save size={15} /> {salvando ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  )
}
