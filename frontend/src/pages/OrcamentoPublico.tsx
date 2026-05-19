import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, XCircle, Clock, AlertTriangle, Phone, Wrench, Package } from 'lucide-react'

interface Item {
  id: number
  tipo: 'servico' | 'peca'
  descricao: string
  quantidade: string
  preco_unitario: string
  total: string
}

interface OrcamentoPublico {
  id: number
  numero: string
  status: string
  status_display: string
  cliente_nome: string
  veiculo_info: string
  problema_relatado: string
  observacoes: string
  itens: Item[]
  total_servicos: string
  total_pecas: string
  desconto: string
  total_geral: string
  validade: string | null
  oficina_nome: string
  oficina_telefone: string
  criado_em: string
}

function fmt(v: string | number) {
  return parseFloat(String(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; cor: string; fundo: string }> = {
  pendente:  { label: 'Aguardando sua resposta', icon: Clock,        cor: 'text-amber-700',  fundo: 'bg-amber-50 border-amber-200' },
  aprovado:  { label: 'Orçamento aprovado',      icon: CheckCircle,  cor: 'text-green-700',  fundo: 'bg-green-50 border-green-200' },
  rejeitado: { label: 'Orçamento recusado',       icon: XCircle,      cor: 'text-red-700',    fundo: 'bg-red-50 border-red-200' },
  expirado:  { label: 'Orçamento expirado',       icon: AlertTriangle,cor: 'text-slate-600',  fundo: 'bg-slate-50 border-slate-200' },
}

export default function OrcamentoPublico() {
  const { token } = useParams<{ token: string }>()
  const [orc, setOrc] = useState<OrcamentoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [respondendo, setRespondendo] = useState(false)

  useEffect(() => {
    if (!token) return
    axios.get(`/api/orcamento-publico/${token}/`)
      .then(r => setOrc(r.data))
      .catch(() => setErro('Orçamento não encontrado ou link inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  const responder = async (resposta: 'aprovado' | 'rejeitado') => {
    if (!token) return
    const confirmMsg = resposta === 'aprovado'
      ? 'Confirmar aprovação do orçamento?'
      : 'Confirmar recusa do orçamento?'
    if (!confirm(confirmMsg)) return
    setRespondendo(true)
    try {
      await axios.post(`/api/orcamento-publico/${token}/responder/`, { resposta })
      setOrc(prev => prev ? { ...prev, status: resposta, status_display: resposta === 'aprovado' ? 'Aprovado' : 'Rejeitado' } : prev)
    } catch {
      alert('Erro ao enviar resposta.')
    } finally {
      setRespondendo(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (erro || !orc) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">{erro}</p>
      </div>
    </div>
  )

  const cfg = STATUS_CFG[orc.status] ?? STATUS_CFG['pendente']
  const Icon = cfg.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{orc.oficina_nome}</p>
            <h1 className="text-base font-bold text-gray-800">Orçamento {orc.numero}</h1>
          </div>
          {orc.oficina_telefone && (
            <a href={`tel:${orc.oficina_telefone}`}
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-medium">
              <Phone size={13} /> Ligar
            </a>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Status */}
        <div className={`border rounded-2xl p-5 ${cfg.fundo}`}>
          <div className={`flex items-center gap-3 ${cfg.cor}`}>
            <Icon size={26} />
            <div>
              <p className="font-bold text-lg leading-tight">{cfg.label}</p>
              <p className="text-xs opacity-70">{orc.cliente_nome} · {orc.veiculo_info}</p>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 mb-3">Itens do orçamento</p>
          <div className="space-y-2">
            {orc.itens.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  {item.tipo === 'servico'
                    ? <Wrench size={14} className="text-blue-500 shrink-0" />
                    : <Package size={14} className="text-orange-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.descricao}</p>
                    <p className="text-xs text-gray-400">{item.quantidade} × {fmt(item.preco_unitario)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800 ml-4 shrink-0">{fmt(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totais */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Serviços</span><span>{fmt(orc.total_servicos)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Peças</span><span>{fmt(orc.total_pecas)}</span>
          </div>
          {parseFloat(orc.desconto) > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Desconto</span><span>- {fmt(orc.desconto)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-2">
            <span>Total</span><span>{fmt(orc.total_geral)}</span>
          </div>
        </div>

        {orc.problema_relatado && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Problema relatado</p>
            <p className="text-sm text-gray-700">{orc.problema_relatado}</p>
          </div>
        )}

        {orc.validade && (
          <p className="text-xs text-center text-gray-400">
            Válido até {new Date(orc.validade).toLocaleDateString('pt-BR')}
          </p>
        )}

        {/* Botões de resposta */}
        {orc.status === 'pendente' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => responder('rejeitado')} disabled={respondendo}
              className="flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-2xl py-3.5 hover:bg-red-50 transition-colors disabled:opacity-50">
              <XCircle size={18} /> Recusar
            </button>
            <button onClick={() => responder('aprovado')} disabled={respondendo}
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold rounded-2xl py-3.5 hover:bg-green-700 transition-colors disabled:opacity-50">
              <CheckCircle size={18} /> Aprovar
            </button>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs pb-4">
          DoMecânico · {orc.oficina_nome}
        </p>
      </div>
    </div>
  )
}
