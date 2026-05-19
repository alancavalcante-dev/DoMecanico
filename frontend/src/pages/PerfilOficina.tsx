import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Wrench, Send, CheckCircle, ChevronDown, Search, FileText } from 'lucide-react'
import { perfilAPI } from '../api'
import axios from 'axios'

const publicApi = axios.create({ baseURL: '/api' })

const STATUS_COR: Record<string, string> = {
  aberta: 'bg-blue-500/15 text-blue-400',
  em_andamento: 'bg-amber-500/15 text-amber-400',
  aguardando_peca: 'bg-orange-500/15 text-orange-400',
  concluida: 'bg-green-500/15 text-green-400',
  cancelada: 'bg-red-500/15 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  aguardando_peca: 'Aguardando peça',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

function AcompanharOS({ cor, slug }: { cor: string; slug: string }) {
  const [placa, setPlaca] = useState('')
  const [cpf, setCpf] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<any[] | null>(null)
  const [erro, setErro] = useState('')

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!placa.trim() && !cpf.trim()) return
    setBuscando(true)
    setErro('')
    setResultado(null)
    try {
      const params: Record<string, string> = {}
      if (placa.trim()) params.placa = placa.trim().toUpperCase()
      if (cpf.trim()) params.cpf = cpf.replace(/\D/g, '')
      const res = await publicApi.get(`/mecanica/os-publica/oficina/${slug}/`, { params })
      const lista = Array.isArray(res.data) ? res.data : res.data.results ?? []
      setResultado(lista)
      if (lista.length === 0) setErro('Nenhuma OS encontrada com esses dados.')
    } catch {
      setErro('Não foi possível buscar. Verifique os dados e tente novamente.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5">
      <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <FileText size={16} />
        Acompanhar minha OS
      </h2>
      <p className="text-xs text-gray-500 mb-4">Informe a placa do veículo e/ou o CPF para ver o status do serviço</p>

      <form onSubmit={buscar} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={placa}
            onChange={e => setPlaca(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            placeholder="Placa (ex: ABC1234)"
            maxLength={7}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            value={cpf}
            onChange={e => setCpf(e.target.value.replace(/\D/g, ''))}
            placeholder="CPF (só números)"
            maxLength={11}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          type="submit"
          disabled={buscando || (!placa.trim() && !cpf.trim())}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: cor }}
        >
          <Search size={15} />
          {buscando ? 'Buscando...' : 'Buscar OS'}
        </button>
      </form>

      {erro && (
        <p className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2">{erro}</p>
      )}

      {resultado && resultado.length > 0 && (
        <div className="mt-4 space-y-3">
          {resultado.map((os: any) => (
            <div key={os.id} className="bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">OS #{os.numero}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[os.status] || 'bg-gray-700 text-gray-300'}`}>
                  {STATUS_LABEL[os.status] || os.status}
                </span>
              </div>
              <p className="text-sm text-white font-medium">{os.veiculo_placa} — {os.veiculo_modelo || ''}</p>
              {os.descricao_problema && (
                <p className="text-xs text-gray-400 line-clamp-2">{os.descricao_problema}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Entrada: {os.data_entrada ? new Date(os.data_entrada).toLocaleDateString('pt-BR') : '—'}</span>
                {os.token_publico && (
                  <Link
                    to={`/acompanhar/${os.token_publico}`}
                    className="font-medium hover:underline"
                    style={{ color: cor }}
                  >
                    Ver detalhes →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface PerfilData {
  nome: string
  slug_publico: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  horario_funcionamento: string
  descricao_publica: string
  servicos_oferecidos: string[]
  logo: string | null
  cor_primaria: string
}

interface FormData {
  nome_cliente: string
  telefone: string
  email_cliente: string
  veiculo_placa: string
  veiculo_descricao: string
  servico_desejado: string
  data: string
  hora: string
  observacoes: string
}

const FORM_VAZIO: FormData = {
  nome_cliente: '',
  telefone: '',
  email_cliente: '',
  veiculo_placa: '',
  veiculo_descricao: '',
  servico_desejado: '',
  data: '',
  hora: '',
  observacoes: '',
}

export default function PerfilOficina() {
  const { slug } = useParams<{ slug: string }>()
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState<FormData>(FORM_VAZIO)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!slug) return
    perfilAPI.getPublico(slug)
      .then(res => setPerfil(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const data_hora = `${form.data}T${form.hora}:00`
      await perfilAPI.agendar(slug!, {
        nome_cliente: form.nome_cliente,
        telefone: form.telefone,
        email_cliente: form.email_cliente,
        veiculo_placa: form.veiculo_placa,
        veiculo_descricao: form.veiculo_descricao,
        servico_desejado: form.servico_desejado,
        data_hora,
        observacoes: form.observacoes,
      })
      setSucesso(true)
      setForm(FORM_VAZIO)
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Erro ao enviar agendamento. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (notFound || !perfil) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
        <Wrench size={40} className="text-gray-600" />
        <h1 className="text-xl font-bold text-white">Oficina não encontrada</h1>
        <p className="text-gray-400 text-sm text-center">
          Este link pode ter expirado ou a oficina desativou o perfil público.
        </p>
        <Link to="/cadastro" className="text-violet-400 hover:text-violet-300 text-sm">
          Conheça o DoMecânico
        </Link>
      </div>
    )
  }

  const cor = perfil.cor_primaria || '#2563eb'
  const inicial = perfil.nome.charAt(0).toUpperCase()

  const todosServicos = perfil.servicos_oferecidos.length > 0
    ? [...perfil.servicos_oferecidos, 'Outro']
    : ['Outro']

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header style={{ backgroundColor: cor }} className="py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-5">
          {perfil.logo ? (
            <img src={perfil.logo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              {inicial}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{perfil.nome}</h1>
            {(perfil.cidade || perfil.estado) && (
              <p className="text-white/80 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin size={14} />
                {[perfil.cidade, perfil.estado].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {perfil.endereco && (
            <div className="bg-gray-900 rounded-2xl p-4 flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Endereço</p>
                <p className="text-sm text-gray-200">{perfil.endereco}</p>
              </div>
            </div>
          )}
          {perfil.telefone && (
            <div className="bg-gray-900 rounded-2xl p-4 flex items-start gap-3">
              <Phone size={18} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Telefone</p>
                <p className="text-sm text-gray-200">{perfil.telefone}</p>
              </div>
            </div>
          )}
          {perfil.horario_funcionamento && (
            <div className="bg-gray-900 rounded-2xl p-4 flex items-start gap-3">
              <Clock size={18} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Horário</p>
                <p className="text-sm text-gray-200">{perfil.horario_funcionamento}</p>
              </div>
            </div>
          )}
        </div>

        {/* Descrição */}
        {perfil.descricao_publica && (
          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-2">Sobre a oficina</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{perfil.descricao_publica}</p>
          </div>
        )}

        {/* Serviços */}
        {perfil.servicos_oferecidos.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Wrench size={16} />
              Serviços oferecidos
            </h2>
            <div className="flex flex-wrap gap-2">
              {perfil.servicos_oferecidos.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: cor + '33', border: `1px solid ${cor}66` }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Acompanhar OS */}
        <AcompanharOS cor={cor} slug={perfil.slug_publico} />

        {/* Formulário de agendamento */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <ChevronDown size={16} />
            Agendar atendimento
          </h2>

          {sucesso ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle size={40} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">Agendamento enviado!</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Recebemos sua solicitação. A oficina entrará em contato para confirmar o horário.
              </p>
              <button
                onClick={() => setSucesso(false)}
                className="mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: cor }}
              >
                Fazer outro agendamento
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nome completo *</label>
                  <input
                    required
                    name="nome_cliente"
                    value={form.nome_cliente}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Telefone</label>
                  <input
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email_cliente"
                  value={form.email_cliente}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Placa do veículo *</label>
                  <input
                    required
                    name="veiculo_placa"
                    value={form.veiculo_placa}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
                    placeholder="ABC-1234"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Veículo</label>
                  <input
                    name="veiculo_descricao"
                    value={form.veiculo_descricao}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Ex: Gol 2018 branco"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Serviço desejado *</label>
                <select
                  required
                  name="servico_desejado"
                  value={form.servico_desejado}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Selecione um serviço...</option>
                  {todosServicos.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Data *</label>
                  <input
                    required
                    type="date"
                    name="data"
                    value={form.data}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Hora *</label>
                  <input
                    required
                    type="time"
                    name="hora"
                    value={form.hora}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Descreva o problema ou informações adicionais..."
                />
              </div>

              {erro && (
                <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-xl px-3 py-2">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: cor }}
              >
                {enviando ? (
                  <span className="animate-pulse">Enviando...</span>
                ) : (
                  <>
                    <Send size={15} />
                    Solicitar agendamento
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-4 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">
          Powered by{' '}
          <Link to="/cadastro" className="text-violet-400 hover:text-violet-300 font-medium">
            DoMecânico
          </Link>{' '}
          — Experimente grátis
        </p>
      </footer>
    </div>
  )
}
