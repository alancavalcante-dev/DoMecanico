import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  Search, Car, Wrench, Clock, CheckCircle, AlertTriangle,
  PackageOpen, XCircle, Phone, ChevronLeft, X,
  ClipboardCheck, ShieldCheck, FileText, PenLine, RotateCcw,
  MapPin, Calendar, Gauge, Palette, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Servico { descricao: string; quantidade: string }
interface Foto { id: number; foto_url: string; descricao: string; criado_em: string }
interface Dano { regiao: string; tipo: string; foto_url: string | null }

interface ChecklistPublico {
  token_publico: string
  status: 'pendente' | 'assinado'
  quilometragem: number
  nivel_combustivel: string
  observacoes_gerais: string
  assinatura: string
  data_assinatura: string | null
  criado_em: string
  danos: Dano[]
}

interface Garantia {
  servico: string
  prazo_dias: number
  data_inicio: string
  data_expiracao: string
  vigente: boolean
  observacoes: string
}

interface ItemOrcamento {
  descricao: string
  tipo: 'servico' | 'peca'
  quantidade: string
  preco_unitario: string
  total: string
}

interface OrcamentoPublico {
  numero: string
  status: string
  status_display: string
  validade: string | null
  problema_relatado: string
  observacoes: string
  desconto: string
  total_servicos: string
  total_pecas: string
  total_geral: string
  itens: ItemOrcamento[]
  criado_em: string
}

interface OSPublica {
  id: number
  numero: string
  token_publico: string
  status: string
  status_display: string
  cliente_nome: string
  veiculo_info: string
  veiculo_placa: string
  veiculo_marca: string
  veiculo_modelo: string
  veiculo_ano: string | null
  veiculo_cor: string | null
  problema_relatado: string
  diagnostico: string
  observacoes: string
  quilometragem_entrada: number
  data_entrada: string
  data_previsao: string | null
  data_conclusao: string | null
  mecanico_nome: string | null
  fotos_veiculo: Foto[]
  servicos: Servico[]
  oficina_nome: string
  oficina_telefone: string
  oficina_endereco: string
  oficina_cidade: string
  oficina_estado: string
  oficina_cor_primaria: string
  oficina_logo_url: string | null
  checklist: ChecklistPublico | null
  garantias: Garantia[]
  orcamento: OrcamentoPublico | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType; label: string; pct: number
  bg: string; text: string; bar: string; ring: string
}> = {
  aberta:          { icon: Clock,       label: 'Aguardando início',          pct: 10,  bg: 'bg-blue-50',   text: 'text-blue-700',  bar: 'bg-blue-500',   ring: 'ring-blue-200' },
  em_andamento:    { icon: Wrench,      label: 'Em andamento',               pct: 55,  bg: 'bg-amber-50',  text: 'text-amber-700', bar: 'bg-amber-500',  ring: 'ring-amber-200' },
  aguardando_peca: { icon: PackageOpen, label: 'Aguardando peça',            pct: 40,  bg: 'bg-orange-50', text: 'text-orange-700',bar: 'bg-orange-500', ring: 'ring-orange-200' },
  concluida:       { icon: CheckCircle, label: 'Pronto para retirada!',      pct: 100, bg: 'bg-green-50',  text: 'text-green-700', bar: 'bg-green-500',  ring: 'ring-green-200' },
  cancelada:       { icon: XCircle,     label: 'Cancelada',                  pct: 0,   bg: 'bg-red-50',    text: 'text-red-700',   bar: 'bg-red-400',    ring: 'ring-red-200' },
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtMoeda(v: string) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Cabeçalho com logo da oficina ─────────────────────────────────────────────

function CabecalhoOficina({ os, onVoltar }: { os: OSPublica; onVoltar?: () => void }) {
  const cor = os.oficina_cor_primaria || '#2563eb'
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {onVoltar && (
          <button onClick={onVoltar} className="text-gray-400 hover:text-gray-700 -ml-1 shrink-0">
            <ChevronLeft size={22} />
          </button>
        )}
        {os.oficina_logo_url ? (
          <img
            src={os.oficina_logo_url}
            alt={os.oficina_nome}
            className="h-9 w-9 object-contain rounded-lg shrink-0 border border-gray-100"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-black"
            style={{ backgroundColor: cor }}>
            {os.oficina_nome.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate leading-tight">{os.oficina_nome}</p>
          {os.oficina_cidade && (
            <p className="text-gray-400 text-xs flex items-center gap-1 leading-tight">
              <MapPin size={10} /> {os.oficina_cidade}{os.oficina_estado ? ` / ${os.oficina_estado}` : ''}
            </p>
          )}
        </div>
        {os.oficina_telefone && (
          <a href={`tel:${os.oficina_telefone}`}
            className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-full font-semibold shrink-0"
            style={{ backgroundColor: cor }}>
            <Phone size={12} /> Ligar
          </a>
        )}
      </div>
    </div>
  )
}

// ── Hero do veículo ───────────────────────────────────────────────────────────

function HeroVeiculo({ os }: { os: OSPublica }) {
  const cor = os.oficina_cor_primaria || '#2563eb'
  const cfg = STATUS_CONFIG[os.status] ?? STATUS_CONFIG['aberta']
  const Icon = cfg.icon
  const [fotoHero, setFotoHero] = useState<Foto | null>(null)

  const fotoPrincipal = os.fotos_veiculo[0]

  return (
    <>
      {/* Foto de capa ou banner de cor */}
      <div className="relative h-52 overflow-hidden">
        {fotoPrincipal ? (
          <>
            <img
              src={fotoPrincipal.foto_url}
              alt="Veículo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cor}22, ${cor}11)` }}>
            <Car size={64} className="opacity-20" style={{ color: cor }} />
          </div>
        )}

        {/* placa no canto */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-center shadow-md">
          <p className="font-black text-gray-800 tracking-widest text-sm font-mono">{os.veiculo_placa}</p>
          <p className="text-gray-400 text-[9px] uppercase tracking-wider leading-none mt-0.5">Brasil</p>
        </div>

        {/* info do veículo sobre a foto */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <h2 className={`font-black text-xl leading-tight ${fotoPrincipal ? 'text-white' : 'text-gray-800'}`}>
            {os.veiculo_marca} {os.veiculo_modelo}
          </h2>
          <div className={`flex items-center gap-3 text-sm mt-0.5 ${fotoPrincipal ? 'text-white/70' : 'text-gray-500'}`}>
            {os.veiculo_ano && <span>{os.veiculo_ano}</span>}
            {os.veiculo_cor && (
              <span className="flex items-center gap-1">
                <Palette size={11} /> {os.veiculo_cor}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Gauge size={11} /> {os.quilometragem_entrada.toLocaleString('pt-BR')} km
            </span>
          </div>
        </div>
      </div>

      {/* Galeria de fotos extras */}
      {os.fotos_veiculo.length > 1 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {os.fotos_veiculo.map((foto, i) => (
              <button key={foto.id} onClick={() => setFotoHero(foto)}
                className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === 0 ? 'opacity-60' : ''} border-transparent hover:border-blue-400`}>
                <img src={foto.foto_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card de status */}
      <div className="max-w-lg mx-auto px-4 -mt-2 relative z-10">
        <div className={`rounded-2xl p-4 border-2 shadow-sm mt-3 ${cfg.bg} ${cfg.ring} ring-1`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
              <Icon size={20} className={cfg.text} />
            </div>
            <div className="flex-1">
              <p className={`font-bold text-base ${cfg.text}`}>{cfg.label}</p>
              <p className="text-gray-400 text-xs">OS {os.numero} · {os.cliente_nome}</p>
            </div>
          </div>
          {/* Barra de progresso com etapas */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              {['Entrada', 'Análise', 'Execução', 'Pronto'].map((etapa, i) => {
                const pcts = [0, 25, 55, 100]
                const ativo = cfg.pct >= pcts[i]
                return (
                  <div key={etapa} className="flex flex-col items-center gap-1">
                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${ativo ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                      style={ativo ? { backgroundColor: cor } : {}} />
                    <span className={`text-[9px] font-medium ${ativo ? 'text-gray-600' : 'text-gray-300'}`}>{etapa}</span>
                  </div>
                )
              })}
            </div>
            <div className="absolute top-1.5 left-1.5 right-1.5 h-0.5 bg-gray-200 -z-10 rounded-full">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cfg.pct}%`, backgroundColor: cor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {fotoHero && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoHero(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={26} /></button>
          <img src={fotoHero.foto_url} alt={fotoHero.descricao}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()} />
          {fotoHero.descricao && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm">{fotoHero.descricao}</p>
          )}
        </div>
      )}
    </>
  )
}

// ── Canvas de assinatura ──────────────────────────────────────────────────────

function AssinaturaCanvas({ onSalvar, salvando }: { onSalvar: (d: string) => void; salvando: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [temTraco, setTemTraco] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * (canvas.width / rect.width), y: (t.clientY - rect.top) * (canvas.height / rect.height) }
    }
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }

  const iniciar = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    drawing.current = true
    e.preventDefault()
  }

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    ctx.stroke()
    setTemTraco(true)
    e.preventDefault()
  }

  const parar = () => { drawing.current = false }

  const limpar = () => {
    canvasRef.current!.getContext('2d')!.clearRect(0, 0, 600, 180)
    setTemTraco(false)
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Assine abaixo com o dedo ou mouse:</p>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        <canvas ref={canvasRef} width={600} height={180} className="w-full touch-none cursor-crosshair"
          onMouseDown={iniciar} onMouseMove={desenhar} onMouseUp={parar} onMouseLeave={parar}
          onTouchStart={iniciar} onTouchMove={desenhar} onTouchEnd={parar} />
        {!temTraco && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm flex items-center gap-1"><PenLine size={14} /> Assinatura aqui</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={limpar}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">
          <RotateCcw size={13} /> Limpar
        </button>
        <button onClick={() => temTraco && onSalvar(canvasRef.current!.toDataURL('image/png'))}
          disabled={!temTraco || salvando}
          className="flex-1 text-white text-sm font-semibold rounded-lg py-2 transition-colors disabled:opacity-40 bg-blue-600 hover:bg-blue-700">
          {salvando ? 'Salvando...' : 'Confirmar assinatura'}
        </button>
      </div>
    </div>
  )
}

// ── Seção Checklist ───────────────────────────────────────────────────────────

const COMBUSTIVEL_CORES: Record<string, string> = {
  'Vazio': 'bg-red-100 text-red-600',
  '1/4':   'bg-orange-100 text-orange-600',
  '1/2':   'bg-yellow-100 text-yellow-700',
  '3/4':   'bg-lime-100 text-lime-700',
  'Cheio': 'bg-green-100 text-green-700',
}

function SecaoChecklist({ checklist, onAssinado }: {
  checklist: ChecklistPublico
  onAssinado: (c: ChecklistPublico) => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [fotoDano, setFotoDano] = useState<Dano | null>(null)
  const [aberto, setAberto] = useState(checklist.status === 'pendente')

  const assinar = async (dataUrl: string) => {
    setSalvando(true); setErro('')
    try {
      await axios.post(`/api/checklist-publico/${checklist.token_publico}/assinar/`, { assinatura: dataUrl })
      onAssinado({ ...checklist, status: 'assinado', assinatura: dataUrl, data_assinatura: new Date().toISOString() })
    } catch { setErro('Erro ao salvar assinatura. Tente novamente.') }
    finally { setSalvando(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setAberto(v => !v)}
        className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-left">
        <ClipboardCheck size={15} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800 text-sm flex-1">Checklist de entrada</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${checklist.status === 'assinado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {checklist.status === 'assinado' ? 'Assinado' : 'Aguardando'}
        </span>
        {aberto ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {aberto && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Quilometragem</p>
              <p className="font-bold text-gray-800">{checklist.quilometragem.toLocaleString('pt-BR')} km</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Combustível</p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${COMBUSTIVEL_CORES[checklist.nivel_combustivel] ?? 'bg-gray-100 text-gray-600'}`}>
                {checklist.nivel_combustivel}
              </span>
            </div>
          </div>

          {checklist.observacoes_gerais && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Observações</p>
              <p className="text-sm text-gray-600">{checklist.observacoes_gerais}</p>
            </div>
          )}

          {checklist.danos.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">
                {checklist.danos.length} dano{checklist.danos.length > 1 ? 's' : ''} registrado{checklist.danos.length > 1 ? 's' : ''} na entrada
              </p>
              {/* Grid de fotos dos danos */}
              {checklist.danos.some(d => d.foto_url) && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {checklist.danos.filter(d => d.foto_url).map((d, i) => (
                    <button key={i} onClick={() => setFotoDano(d)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-red-100 hover:border-red-300 transition-colors relative group">
                      <img src={d.foto_url!} alt={d.regiao} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-4">
                        <p className="text-white text-[9px] font-medium truncate">{d.regiao}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-1.5">
                {checklist.danos.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                    <span className="text-red-700 flex-1">{d.regiao} — {d.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {checklist.danos.length === 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 text-green-700 text-sm">
              <CheckCircle size={15} className="shrink-0" /> Nenhum dano registrado na entrada
            </div>
          )}

          {checklist.status === 'assinado' ? (
            <div className="border border-green-100 bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} /> Assinado em {new Date(checklist.data_assinatura!).toLocaleString('pt-BR')}
              </p>
              {checklist.assinatura && (
                <img src={checklist.assinatura} alt="Assinatura"
                  className="max-h-16 border border-green-200 rounded-lg bg-white p-1" />
              )}
            </div>
          ) : (
            <div className="border border-amber-100 bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-800 font-medium mb-3">
                A oficina solicita sua assinatura confirmando as condições de entrada do veículo.
              </p>
              {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
              <AssinaturaCanvas onSalvar={assinar} salvando={salvando} />
            </div>
          )}
        </div>
      )}

      {fotoDano && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setFotoDano(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={26} /></button>
          <img src={fotoDano.foto_url!} alt={fotoDano.regiao}
            className="max-w-full max-h-[75vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()} />
          <div className="mt-4 text-center">
            <p className="text-white font-semibold">{fotoDano.regiao}</p>
            <p className="text-white/60 text-sm">{fotoDano.tipo}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Seção Orçamento ───────────────────────────────────────────────────────────

function SecaoOrcamento({ orc }: { orc: OrcamentoPublico }) {
  const [aberto, setAberto] = useState(true)
  const servicosItens = orc.itens.filter(i => i.tipo === 'servico')
  const pecasItens = orc.itens.filter(i => i.tipo === 'peca')

  const ORC_BADGE: Record<string, string> = {
    pendente:  'bg-amber-100 text-amber-700',
    aprovado:  'bg-green-100 text-green-700',
    rejeitado: 'bg-red-100 text-red-700',
    expirado:  'bg-gray-100 text-gray-500',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setAberto(v => !v)}
        className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-left">
        <FileText size={15} className="text-violet-500" />
        <h3 className="font-semibold text-gray-800 text-sm flex-1">Orçamento {orc.numero}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${ORC_BADGE[orc.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {orc.status_display}
        </span>
        {aberto ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {aberto && (
        <div className="p-4 space-y-3">
          {orc.validade && <p className="text-xs text-gray-400">Válido até {fmt(orc.validade)}</p>}

          {servicosItens.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Serviços</p>
              {servicosItens.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <span className="text-gray-700 flex-1">{i.descricao} <span className="text-gray-400 text-xs">×{i.quantidade}</span></span>
                  <span className="text-gray-700 font-medium ml-4">{fmtMoeda(i.total)}</span>
                </div>
              ))}
            </div>
          )}

          {pecasItens.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Peças</p>
              {pecasItens.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <span className="text-gray-700 flex-1">{i.descricao} <span className="text-gray-400 text-xs">×{i.quantidade}</span></span>
                  <span className="text-gray-700 font-medium ml-4">{fmtMoeda(i.total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            {Number(orc.total_servicos) > 0 && (
              <div className="flex justify-between text-gray-500"><span>Serviços</span><span>{fmtMoeda(orc.total_servicos)}</span></div>
            )}
            {Number(orc.total_pecas) > 0 && (
              <div className="flex justify-between text-gray-500"><span>Peças</span><span>{fmtMoeda(orc.total_pecas)}</span></div>
            )}
            {Number(orc.desconto) > 0 && (
              <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{fmtMoeda(orc.desconto)}</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
              <span>Total</span><span>{fmtMoeda(orc.total_geral)}</span>
            </div>
          </div>
          {orc.observacoes && <p className="text-xs text-gray-500">{orc.observacoes}</p>}
        </div>
      )}
    </div>
  )
}

// ── Seção Garantias ───────────────────────────────────────────────────────────

function SecaoGarantias({ garantias }: { garantias: Garantia[] }) {
  const vigentes = garantias.filter(g => g.vigente).length
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck size={15} className="text-green-500" />
        <h3 className="font-semibold text-gray-800 text-sm">Garantias</h3>
        <span className="ml-auto text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
          {vigentes} vigente{vigentes !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {garantias.map((g, i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${g.vigente ? 'bg-green-100' : 'bg-gray-100'}`}>
              <ShieldCheck size={14} className={g.vigente ? 'text-green-600' : 'text-gray-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{g.servico}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar size={10} /> {fmt(g.data_inicio)} → {fmt(g.data_expiracao)} · {g.prazo_dias} dias
              </p>
              {g.observacoes && <p className="text-xs text-gray-500 mt-1">{g.observacoes}</p>}
            </div>
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${g.vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {g.vigente ? 'Vigente' : 'Expirada'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Detalhe completo da OS ─────────────────────────────────────────────────────

function DetalheOS({ os: initialOs, onVoltar }: { os: OSPublica; onVoltar?: () => void }) {
  const [os, setOs] = useState(initialOs)

  return (
    <div className="min-h-screen bg-gray-50">
      <CabecalhoOficina os={os} onVoltar={onVoltar} />
      <HeroVeiculo os={os} />

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-3">

        {/* Datas */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Entrada', val: fmt(os.data_entrada), icon: Calendar },
            { label: 'Previsão', val: fmt(os.data_previsao), icon: Clock },
            { label: 'Conclusão', val: fmt(os.data_conclusao), icon: CheckCircle },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
              <Icon size={14} className="text-gray-400 mx-auto mb-1" />
              <p className="text-gray-400 text-[10px] mb-0.5">{label}</p>
              <p className="font-semibold text-gray-700 text-xs">{val}</p>
            </div>
          ))}
        </div>

        {/* Problema relatado */}
        {os.problema_relatado && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Problema relatado</p>
            <p className="text-gray-700 text-sm leading-relaxed">{os.problema_relatado}</p>
          </div>
        )}

        {/* Mecânico */}
        {os.mecanico_nome && (
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Wrench size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Mecânico responsável</p>
              <p className="font-semibold text-gray-800 text-sm">{os.mecanico_nome}</p>
            </div>
          </div>
        )}

        {/* Checklist */}
        {os.checklist && (
          <SecaoChecklist
            checklist={os.checklist}
            onAssinado={c => setOs(prev => ({ ...prev, checklist: c }))}
          />
        )}

        {/* Orçamento */}
        {os.orcamento && <SecaoOrcamento orc={os.orcamento} />}

        {/* Diagnóstico */}
        {os.status === 'concluida' && os.diagnostico && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-400 mb-1 font-medium uppercase tracking-wide">Diagnóstico da oficina</p>
            <p className="text-blue-800 text-sm leading-relaxed">{os.diagnostico}</p>
          </div>
        )}

        {/* Serviços realizados */}
        {os.status === 'concluida' && os.servicos.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide flex items-center gap-1">
              <Wrench size={12} /> Serviços realizados
            </p>
            <ul className="space-y-2">
              {os.servicos.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                  <span className="text-gray-700 flex-1">{s.descricao}</span>
                  {s.quantidade !== '1' && <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">×{s.quantidade}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Garantias */}
        {os.status === 'concluida' && os.garantias.length > 0 && (
          <SecaoGarantias garantias={os.garantias} />
        )}

        {/* Observações */}
        {os.status === 'concluida' && os.observacoes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs text-amber-500 mb-1 font-medium uppercase tracking-wide">Observações</p>
            <p className="text-amber-800 text-sm leading-relaxed">{os.observacoes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="pt-2 flex flex-col items-center gap-1">
          {os.oficina_logo_url ? (
            <img src={os.oficina_logo_url} alt={os.oficina_nome} className="h-6 object-contain opacity-50" />
          ) : (
            <p className="text-gray-400 text-xs font-medium">{os.oficina_nome}</p>
          )}
          <p className="text-gray-300 text-[10px]">Powered by DoMecânico</p>
        </div>
      </div>
    </div>
  )
}

// ── Página via token (/acompanhar/:token) ─────────────────────────────────────

export function AcompanharOSToken() {
  const { token } = useParams<{ token: string }>()
  const [os, setOs] = useState<OSPublica | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return
    axios.get(`/api/os-publica/${token}/`)
      .then(r => setOs(r.data))
      .catch(() => setErro('OS não encontrada ou link inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm animate-pulse">Carregando...</div>
    </div>
  )

  if (erro || !os) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">{erro || 'OS não encontrada.'}</p>
      </div>
    </div>
  )

  return <DetalheOS os={os} />
}

// ── Página de busca (/acompanhar) ─────────────────────────────────────────────

const STATUS_BADGE_BUSCA: Record<string, string> = {
  aberta:          'bg-blue-100 text-blue-700',
  em_andamento:    'bg-amber-100 text-amber-700',
  aguardando_peca: 'bg-orange-100 text-orange-700',
  concluida:       'bg-green-100 text-green-700',
  cancelada:       'bg-red-100 text-red-700',
}

export default function AcompanharOS() {
  const [placa, setPlaca] = useState('')
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultados, setResultados] = useState<OSPublica[] | null>(null)
  const [selecionada, setSelecionada] = useState<OSPublica | null>(null)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErro(''); setResultados(null)
    try {
      const r = await axios.post('/api/os-publica/buscar/', {
        placa: placa.replace(/[^a-zA-Z0-9]/g, ''),
        cpf_cnpj: cpf.replace(/[^0-9]/g, ''),
      })
      const dados: OSPublica[] = r.data
      if (dados.length === 1) setSelecionada(dados[0])
      else setResultados(dados)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      setErro(msg || 'Nenhuma OS encontrada.')
    } finally { setLoading(false) }
  }

  if (selecionada) return <DetalheOS os={selecionada} onVoltar={() => setSelecionada(null)} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero da busca */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white px-4 pt-12 pb-16">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-14 h-14 mx-auto mb-4">
            <img src="/logotipo.png" alt="DoMecânico" className="w-14 h-14 rounded-2xl object-contain" />
          </div>
          <h1 className="text-2xl font-black">Acompanhe seu veículo</h1>
          <p className="text-blue-200 text-sm mt-2">
            Digite a placa e seu CPF/CNPJ para ver o status em tempo real
          </p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-8">
        <form onSubmit={buscar} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Placa do veículo</label>
            <input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1234 ou ABC1D23" maxLength={8} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-400 tracking-widest font-mono uppercase text-center text-base font-bold" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">CPF ou CNPJ (somente números)</label>
            <input value={cpf} onChange={e => setCpf(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="00000000000" maxLength={14} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-400" />
          </div>
          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
              <AlertTriangle size={15} className="shrink-0" /> {erro}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2">
            <Search size={16} /> {loading ? 'Buscando...' : 'Buscar minha OS'}
          </button>
        </form>

        {resultados && resultados.length > 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-gray-500 text-sm text-center font-medium">{resultados.length} ordens encontradas</p>
            {resultados.map(os => (
              <button key={os.id} onClick={() => setSelecionada(os)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all overflow-hidden">
                {/* Mini foto do veículo se houver */}
                {os.fotos_veiculo[0] && (
                  <div className="h-24 overflow-hidden">
                    <img src={os.fotos_veiculo[0].foto_url} alt="Veículo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-gray-800 text-sm">OS {os.numero}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE_BUSCA[os.status] || 'bg-gray-100 text-gray-600'}`}>
                      {os.status_display}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">{os.veiculo_marca} {os.veiculo_modelo}</p>
                  <div className="flex items-center gap-3 mt-1 text-gray-400 text-xs">
                    <span className="font-mono font-bold">{os.veiculo_placa}</span>
                    <span>·</span>
                    <span>{fmt(os.data_entrada)}</span>
                    <span>·</span>
                    <span>{os.oficina_nome}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-8 pb-8">Powered by DoMecânico</p>
      </div>
    </div>
  )
}
