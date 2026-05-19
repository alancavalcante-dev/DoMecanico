import { useEffect, useState } from 'react'
import { Globe, Copy, Check, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { perfilAPI } from '../api'

interface ConfigData {
  slug_publico: string
  descricao_publica: string
  servicos_oferecidos: string
  horario_funcionamento: string
  perfil_publico_ativo: boolean
  cor_primaria: string
}

const CONFIG_VAZIA: ConfigData = {
  slug_publico: '',
  descricao_publica: '',
  servicos_oferecidos: '',
  horario_funcionamento: '',
  perfil_publico_ativo: false,
  cor_primaria: '#2563eb',
}

export default function PerfilPublico() {
  const [config, setConfig] = useState<ConfigData>(CONFIG_VAZIA)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    perfilAPI.getConfig()
      .then(res => setConfig(res.data))
      .catch(() => toast.error('Erro ao carregar configurações.'))
      .finally(() => setLoading(false))
  }, [])

  const urlPublica = config.slug_publico
    ? `${window.location.origin}/oficina/${config.slug_publico}`
    : ''

  const copiarUrl = () => {
    if (!urlPublica) return
    navigator.clipboard.writeText(urlPublica)
    setCopiado(true)
    toast.success('URL copiada!')
    setTimeout(() => setCopiado(false), 2000)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const res = await perfilAPI.salvarConfig({
        descricao_publica: config.descricao_publica,
        servicos_oferecidos: config.servicos_oferecidos,
        horario_funcionamento: config.horario_funcionamento,
        perfil_publico_ativo: config.perfil_publico_ativo,
        cor_primaria: config.cor_primaria,
      })
      setConfig(res.data)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm animate-pulse">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-600 rounded-xl">
          <Globe size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Perfil Público</h1>
          <p className="text-sm text-slate-500">Configure a página pública da sua oficina para clientes agendarem online</p>
        </div>
      </div>

      {/* Toggle ativo */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Perfil público</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {config.perfil_publico_ativo
                ? 'Seu perfil está visível para clientes externos.'
                : 'Ative para que clientes encontrem e agendem online.'}
            </p>
          </div>
          <button
            onClick={() => setConfig(p => ({ ...p, perfil_publico_ativo: !p.perfil_publico_ativo }))}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              config.perfil_publico_ativo ? 'bg-violet-600' : 'bg-gray-700'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              config.perfil_publico_ativo ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>

        {/* URL pública */}
        {config.perfil_publico_ativo && urlPublica && (
          <div className="mt-4 flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
            <Eye size={14} className="text-gray-400 shrink-0" />
            <span className="text-xs text-violet-300 flex-1 truncate">{urlPublica}</span>
            <button
              onClick={copiarUrl}
              className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0"
              title="Copiar URL"
            >
              {copiado ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <a
              href={urlPublica}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0"
              title="Abrir página"
            >
              <EyeOff size={14} />
            </a>
          </div>
        )}
      </div>

      {/* Cor primária */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Cor da oficina</h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.cor_primaria}
            onChange={e => setConfig(p => ({ ...p, cor_primaria: e.target.value }))}
            className="w-12 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
          />
          <div className="flex-1">
            <input
              type="text"
              value={config.cor_primaria}
              onChange={e => setConfig(p => ({ ...p, cor_primaria: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="#2563eb"
              maxLength={7}
            />
          </div>
          <div
            className="w-10 h-10 rounded-xl shrink-0"
            style={{ backgroundColor: config.cor_primaria }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Esta cor será usada no cabeçalho e botões da página pública.
        </p>
      </div>

      {/* Descrição */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Descrição da oficina</h2>
        <textarea
          value={config.descricao_publica}
          onChange={e => setConfig(p => ({ ...p, descricao_publica: e.target.value }))}
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          placeholder="Descreva sua oficina: especialidades, diferenciais, anos de experiência..."
        />
      </div>

      {/* Serviços */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Serviços oferecidos</h2>
        <p className="text-xs text-gray-500 mb-3">Um serviço por linha. Serão exibidos como opções no formulário de agendamento.</p>
        <textarea
          value={config.servicos_oferecidos}
          onChange={e => setConfig(p => ({ ...p, servicos_oferecidos: e.target.value }))}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
          placeholder={"Troca de óleo\nAlinhamento e balanceamento\nFreios\nSuspensão\nElétrica automotiva"}
        />
      </div>

      {/* Horário */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Horário de funcionamento</h2>
        <input
          type="text"
          value={config.horario_funcionamento}
          onChange={e => setConfig(p => ({ ...p, horario_funcionamento: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Ex: Seg-Sex 8h-18h, Sáb 8h-12h"
        />
      </div>

      {/* Botão salvar */}
      <div className="flex justify-end pb-4">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Save size={15} />
          {salvando ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}
