import { useEffect, useState, useRef, useCallback } from 'react'
import { whatsappAPI } from '../api'
import PageHeader from '../components/ui/PageHeader'
import {
  MessageCircle, Save, Send, CheckCircle2, XCircle,
  Info, Wifi, WifiOff, QrCode, RefreshCw, LogOut, Loader2,
  Smartphone, Server,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Config {
  id?: number
  ativo: boolean
  instance_name: string
  msg_os_concluida: boolean
  msg_orcamento_enviado: boolean
  msg_agendamento_confirmado: boolean
  template_os_concluida: string
  template_orcamento: string
  template_agendamento: string
}

interface StatusWA {
  conectado: boolean
  estado: string
  detalhe?: string
}

const DEFAULTS = {
  os_concluida: "Olá {cliente_nome}! 👋\n\n✅ O seu veículo *{veiculo}* está pronto!\n\n📋 *OS:* {os_numero}\n🔧 *Oficina:* {oficina_nome}\n\nAcompanhe os detalhes pelo link:\n{link}\n\nQualquer dúvida, entre em contato! 😊",
  orcamento: "Olá {cliente_nome}! 👋\n\n📄 Seu orçamento *#{orcamento_numero}* está disponível.\n\n🔧 *Oficina:* {oficina_nome}\n🚗 *Veículo:* {veiculo}\n\nAcesse para aprovar ou recusar:\n{link}\n\nVálido até *{validade}*.",
  agendamento: "Olá {cliente_nome}! 👋\n\n📅 Agendamento confirmado!\n\n🔧 *Oficina:* {oficina_nome}\n📆 *Data:* {data}\n🕐 *Horário:* {horario}\n🚗 *Serviço:* {servico}\n\nAté lá! 😊",
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-200'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </label>
  )
}

function Variavel({ nome, desc }: { nome: string; desc: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono mr-1 mb-1">
      {'{' + nome + '}'} <span className="font-sans text-slate-400 text-[10px]">{desc}</span>
    </span>
  )
}

// ── Painel de conexão QR ──────────────────────────────────────────────────────

function PainelConexao({ instanceName }: { instanceName: string }) {
  const [status, setStatus] = useState<StatusWA | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [conectando, setConectando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const poolingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buscarStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const r = await whatsappAPI.status()
      setStatus(r.data)
      if (r.data.conectado) setQr(null)
    } catch {
      setStatus({ conectado: false, estado: 'erro' })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    buscarStatus()
  }, [buscarStatus])

  useEffect(() => {
    if (qr) {
      poolingRef.current = setInterval(buscarStatus, 8000)
    } else {
      if (poolingRef.current) clearInterval(poolingRef.current)
    }
    return () => { if (poolingRef.current) clearInterval(poolingRef.current) }
  }, [qr, buscarStatus])

  const conectar = async () => {
    setConectando(true)
    setQr(null)
    try {
      const r = await whatsappAPI.conectar()
      if (r.data.ja_conectado) {
        toast.success('Já está conectado!')
        buscarStatus()
      } else if (r.data.qr) {
        setQr(r.data.qr)
        toast('Escaneie o QR Code com o WhatsApp do celular da oficina.', { icon: '📱' })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao gerar QR Code.')
    } finally {
      setConectando(false)
    }
  }

  const desconectar = async () => {
    if (!confirm('Desconectar o WhatsApp desta oficina?')) return
    setDesconectando(true)
    try {
      await whatsappAPI.desconectar()
      setStatus({ conectado: false, estado: 'close' })
      setQr(null)
      toast.success('WhatsApp desconectado.')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao desconectar.')
    } finally {
      setDesconectando(false)
    }
  }

  const estadoLabel: Record<string, string> = {
    open: 'Conectado',
    close: 'Desconectado',
    connecting: 'Conectando...',
    sem_config: 'Aguardando configuração',
    timeout: 'Servidor offline',
    erro: 'Erro de conexão',
  }

  return (
    <div className="space-y-4">
      {/* Instância (info apenas) */}
      {instanceName && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <Server size={14} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Identificador da instância</p>
            <p className="text-sm font-mono font-semibold text-slate-700">{instanceName}</p>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loadingStatus ? (
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          ) : status?.conectado ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-slate-400" />
          )}
          <span className={`text-sm font-semibold ${status?.conectado ? 'text-green-700' : 'text-slate-500'}`}>
            {status ? estadoLabel[status.estado] ?? status.estado : 'Verificando...'}
          </span>
          {status?.conectado && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        <button onClick={buscarStatus} disabled={loadingStatus}
          className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* QR Code */}
      {qr && (
        <div className="flex flex-col items-center gap-4 bg-white border-2 border-dashed border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <Smartphone size={16} /> Escaneie com o WhatsApp do celular da oficina
          </div>
          <img src={qr} alt="QR Code WhatsApp" className="w-56 h-56 rounded-xl border border-slate-100 shadow-sm" />
          <div className="text-center text-xs text-slate-500 space-y-0.5">
            <p>1. Abra o WhatsApp no celular</p>
            <p>2. Toque em <strong>⋮ Menu → Aparelhos conectados</strong></p>
            <p>3. Toque em <strong>Conectar um aparelho</strong></p>
            <p>4. Escaneie este QR Code</p>
          </div>
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <RefreshCw size={11} /> Verificando conexão automaticamente...
          </p>
        </div>
      )}

      {/* Botões */}
      {status?.conectado ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">WhatsApp conectado</p>
              <p className="text-xs text-green-600">Mensagens automáticas ativas</p>
            </div>
          </div>
          <button onClick={desconectar} disabled={desconectando}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors shrink-0">
            <LogOut size={14} /> {desconectando ? 'Saindo...' : 'Desconectar'}
          </button>
        </div>
      ) : (
        <button onClick={conectar} disabled={conectando}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
          {conectando
            ? <><Loader2 size={16} className="animate-spin" /> Gerando QR Code...</>
            : <><QrCode size={16} /> Conectar WhatsApp</>
          }
        </button>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ConfiguracaoWhatsApp() {
  const [config, setConfig] = useState<Config>({
    ativo: false,
    instance_name: '',
    msg_os_concluida: true,
    msg_orcamento_enviado: true,
    msg_agendamento_confirmado: true,
    template_os_concluida: '',
    template_orcamento: '',
    template_agendamento: '',
  })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [telefoneTest, setTelefoneTest] = useState('')
  const [testando, setTestando] = useState(false)
  const [abaTemplate, setAbaTemplate] = useState<'os' | 'orcamento' | 'agendamento'>('os')

  useEffect(() => {
    whatsappAPI.config().then(r => setConfig(r.data)).finally(() => setLoading(false))
  }, [])

  const salvar = async () => {
    setSalvando(true)
    try {
      const r = await whatsappAPI.salvar({
        ativo: config.ativo,
        msg_os_concluida: config.msg_os_concluida,
        msg_orcamento_enviado: config.msg_orcamento_enviado,
        msg_agendamento_confirmado: config.msg_agendamento_confirmado,
        template_os_concluida: config.template_os_concluida,
        template_orcamento: config.template_orcamento,
        template_agendamento: config.template_agendamento,
      })
      setConfig(r.data)
      toast.success('Configuração salva!')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const testar = async () => {
    if (!telefoneTest.trim()) { toast.error('Informe um telefone para teste.'); return }
    setTestando(true)
    try {
      const r = await whatsappAPI.testar(telefoneTest)
      if (r.data.sucesso) toast.success(r.data.mensagem)
      else toast.error(r.data.mensagem)
    } catch (err: any) {
      toast.error(err.response?.data?.mensagem || err.response?.data?.erro || 'Erro ao testar.')
    } finally {
      setTestando(false)
    }
  }

  const set = (field: keyof Config) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setConfig(p => ({ ...p, [field]: e.target.value }))

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="WhatsApp"
        subtitle="Mensagens automáticas para seus clientes"
        action={
          <button onClick={salvar} disabled={salvando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
            <Save size={15} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        }
      />

      {/* Toggle geral */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.ativo ? 'bg-green-100' : 'bg-slate-100'}`}>
              <MessageCircle size={20} className={config.ativo ? 'text-green-600' : 'text-slate-400'} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Integração WhatsApp</h2>
              <p className={`text-xs font-medium ${config.ativo ? 'text-green-600' : 'text-slate-400'}`}>
                {config.ativo ? '● Disparos automáticos ativos' : '○ Disparos desativados'}
              </p>
            </div>
          </div>
          <Toggle checked={config.ativo} onChange={v => setConfig(p => ({ ...p, ativo: v }))} label="" desc="" />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5">
          <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Ative a integração, conecte o WhatsApp abaixo escaneando o QR Code, e as mensagens serão enviadas automaticamente para seus clientes.
          </p>
        </div>
      </div>

      {/* Painel de conexão QR */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <QrCode size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Conexão com WhatsApp</h2>
        </div>
        <PainelConexao instanceName={config.instance_name} />
      </div>

      {/* Gatilhos */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Quando enviar mensagens</h2>
        <div className="space-y-4">
          <Toggle checked={config.msg_os_concluida}
            onChange={v => setConfig(p => ({ ...p, msg_os_concluida: v }))}
            label="OS concluída"
            desc="Avisa o cliente quando o veículo está pronto, com link de acompanhamento" />
          <Toggle checked={config.msg_orcamento_enviado}
            onChange={v => setConfig(p => ({ ...p, msg_orcamento_enviado: v }))}
            label="Orçamento enviado"
            desc="Envia link do orçamento para o cliente aprovar ou reprovar" />
          <Toggle checked={config.msg_agendamento_confirmado}
            onChange={v => setConfig(p => ({ ...p, msg_agendamento_confirmado: v }))}
            label="Agendamento confirmado"
            desc="Confirma data e hora do agendamento para o cliente" />
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Textos das mensagens</h2>
          <p className="text-xs text-slate-400">Personalize o texto. Deixe em branco para usar o padrão.</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          {([['os', 'OS Concluída'], ['orcamento', 'Orçamento'], ['agendamento', 'Agendamento']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setAbaTemplate(id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${abaTemplate === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {abaTemplate === 'os' && (
          <div className="space-y-2">
            <div className="flex flex-wrap">
              <Variavel nome="cliente_nome" desc="1º nome" />
              <Variavel nome="veiculo" desc="marca+modelo+placa" />
              <Variavel nome="os_numero" desc="número da OS" />
              <Variavel nome="oficina_nome" desc="oficina" />
              <Variavel nome="link" desc="link público" />
            </div>
            <textarea rows={7} value={config.template_os_concluida} onChange={set('template_os_concluida')}
              placeholder={DEFAULTS.os_concluida}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        )}
        {abaTemplate === 'orcamento' && (
          <div className="space-y-2">
            <div className="flex flex-wrap">
              <Variavel nome="cliente_nome" desc="1º nome" />
              <Variavel nome="orcamento_numero" desc="nº orçamento" />
              <Variavel nome="oficina_nome" desc="oficina" />
              <Variavel nome="veiculo" desc="marca+modelo" />
              <Variavel nome="link" desc="link público" />
              <Variavel nome="validade" desc="data de validade" />
            </div>
            <textarea rows={7} value={config.template_orcamento} onChange={set('template_orcamento')}
              placeholder={DEFAULTS.orcamento}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        )}
        {abaTemplate === 'agendamento' && (
          <div className="space-y-2">
            <div className="flex flex-wrap">
              <Variavel nome="cliente_nome" desc="1º nome" />
              <Variavel nome="oficina_nome" desc="oficina" />
              <Variavel nome="data" desc="dd/mm/aaaa" />
              <Variavel nome="horario" desc="HH:MM" />
              <Variavel nome="servico" desc="serviço" />
            </div>
            <textarea rows={7} value={config.template_agendamento} onChange={set('template_agendamento')}
              placeholder={DEFAULTS.agendamento}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        )}
      </div>

      {/* Teste */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Testar integração</h2>
        <div className="flex gap-3">
          <input type="tel" value={telefoneTest} onChange={e => setTelefoneTest(e.target.value)}
            placeholder="(11) 99999-9999"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={testar} disabled={testando || !config.ativo}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            <Send size={14} /> {testando ? 'Enviando...' : 'Enviar teste'}
          </button>
        </div>
        {!config.ativo && (
          <p className="text-xs text-amber-600 mt-2">Ative a integração e salve antes de testar.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            [true,  'OS concluída → mensagem com link de acompanhamento'],
            [true,  'Orçamento criado → cliente recebe link para aprovar'],
            [true,  'Agendamento confirmado → lembrete com data e hora'],
            [false, 'Cliente sem telefone → mensagem ignorada'],
          ].map(([ok, text], i) => (
            <div key={i} className="flex items-start gap-2">
              {ok ? <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
                  : <XCircle size={13} className="text-slate-300 shrink-0 mt-0.5" />}
              <span className="text-xs text-slate-500">{text as string}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
