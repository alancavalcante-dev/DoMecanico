import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Wrench, CalendarClock, X } from 'lucide-react'
import { dashboardAPI, ordensAPI } from '../api'
import type { OSPatio } from '../types'
import BotoesStatus from '../components/oficina/BotoesStatus'
import OSMecanico from '../components/oficina/OSMecanico'
import { STATUS_INFO, situacaoPrevisao, fmtData, fmtMoeda, tempoDesde } from '../components/oficina/statusOficina'

interface Resumo {
  os_abertas: number
  os_concluidas_mes: number
  faturamento_gerado_mes?: number
  comissao_pendente: number
  comissao_paga: number
}

interface Comissao { id: number; valor: string; pago: boolean; ordem_numero?: string; data_pagamento: string | null }

const normalizaPlaca = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

// Fila de trabalho: atrasadas primeiro, depois quem está "fazendo", depois o resto por entrada.
function ordenarFila(a: OSPatio, b: OSPatio) {
  const peso = (o: OSPatio) => {
    const p = situacaoPrevisao(o.data_previsao, o.status)
    if (p === 'atrasada') return 0
    if (p === 'hoje') return 1
    if (o.status === 'em_andamento') return 2
    if (o.status === 'aberta') return 3
    return 4
  }
  return peso(a) - peso(b) || a.data_entrada.localeCompare(b.data_entrada)
}

export default function MeuPainel() {
  const [dados, setDados] = useState<{ funcionario: { nome: string; cargo: string }; resumo: Resumo; os_abertas: OSPatio[]; comissoes_recentes: Comissao[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [placa, setPlaca] = useState('')
  const [outras, setOutras] = useState<{ id: number; numero: string; veiculo_placa: string; cliente_nome: string; status: OSPatio['status'] }[]>([])
  const [osAberta, setOsAberta] = useState<number | null>(null)

  const carregar = useCallback(() => {
    return dashboardAPI.meuPainel()
      .then(r => { setDados(r.data); setErro('') })
      .catch(e => setErro(e.response?.data?.erro || 'Erro ao carregar painel.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const fila = useMemo(() => {
    if (!dados) return []
    const q = normalizaPlaca(placa)
    const base = q ? dados.os_abertas.filter(o => normalizaPlaca(o.veiculo_placa).includes(q) || o.numero.toUpperCase().includes(q)) : dados.os_abertas
    return [...base].sort(ordenarFila)
  }, [dados, placa])

  // Placa digitada que não está na minha fila: procura nas OS da oficina toda.
  useEffect(() => {
    const q = normalizaPlaca(placa)
    if (q.length < 3 || fila.length > 0) { setOutras([]); return }
    const t = setTimeout(() => {
      // Placa pode estar salva com ou sem hífen: tenta as duas formas.
      const termos = q.length > 3 ? [q, `${q.slice(0, 3)}-${q.slice(3)}`] : [q]
      Promise.all(termos.map(s => ordensAPI.listar({ search: s })))
        .then(rs => {
          const vistos = new Set<number>()
          const todas = rs.flatMap(r => (r.data.results ?? r.data) as OSPatio[])
            .filter(o => o.status !== 'cancelada' && !vistos.has(o.id) && (vistos.add(o.id), true))
          setOutras(todas.slice(0, 5))
        })
        .catch(() => setOutras([]))
    }, 350)
    return () => clearTimeout(t)
  }, [placa, fila.length])

  const atualizarStatusLocal = (id: number, status: OSPatio['status']) => {
    setDados(d => d ? {
      ...d,
      os_abertas: status === 'concluida'
        ? d.os_abertas.filter(o => o.id !== id)
        : d.os_abertas.map(o => o.id === id ? { ...o, status, status_alterado_em: new Date().toISOString() } : o),
    } : d)
    if (status === 'concluida') carregar()
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (erro || !dados) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <Wrench size={32} className="text-amber-400 mx-auto mb-2" />
      <p className="text-amber-700 font-medium">{erro}</p>
      <p className="text-amber-500 text-sm mt-1">
        Peça ao administrador para cadastrar um funcionário com o seu e-mail.
      </p>
    </div>
  )

  const { funcionario, resumo, comissoes_recentes } = dados

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meus carros</h1>
        <p className="text-sm text-slate-500">
          {funcionario.nome} · {resumo.os_abertas} em aberto
        </p>
      </div>

      {/* Busca por placa */}
      <div className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={placa} onChange={e => setPlaca(e.target.value)}
          placeholder="Digite a placa"
          aria-label="Buscar pela placa"
          autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          className="w-full h-16 rounded-xl border-2 border-slate-200 bg-white pl-12 pr-12 text-2xl font-mono font-bold uppercase tracking-widest placeholder:text-base placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:normal-case focus:outline-none focus:border-blue-500" />
        {placa && (
          <button type="button" onClick={() => setPlaca('')} aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Fila de trabalho */}
      {fila.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">{placa ? 'Nenhum carro seu com essa placa.' : 'Nenhum carro com você agora. 👍'}</p>
          {outras.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Na oficina</p>
              <ul className="space-y-2">
                {outras.map(o => (
                  <li key={o.id}>
                    <button type="button" onClick={() => setOsAberta(o.id)}
                      className="w-full flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50 text-left">
                      <span className="font-mono font-bold text-lg">{o.veiculo_placa}</span>
                      <span className="flex-1 text-sm text-slate-600 truncate">{o.cliente_nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_INFO[o.status]?.cor}`}>{STATUS_INFO[o.status]?.curto}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {fila.map(o => {
            const prev = situacaoPrevisao(o.data_previsao, o.status)
            return (
              <li key={o.id}
                className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden ${prev === 'atrasada' ? 'border-red-300' : prev === 'hoje' ? 'border-amber-300' : 'border-slate-200'}`}>
                <button type="button" onClick={() => setOsAberta(o.id)} className="w-full text-left p-4 pb-3 active:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-3xl font-black tracking-wider text-slate-900 leading-none">{o.veiculo_placa}</p>
                      <p className="text-sm text-slate-600 mt-1 truncate">{o.veiculo_modelo} · {o.cliente_nome}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_INFO[o.status].cor}`}>
                      {STATUS_INFO[o.status].curto}
                    </span>
                  </div>
                  {o.problema_relatado && (
                    <p className="mt-2 text-base text-slate-800 line-clamp-2">{o.problema_relatado}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>OS {o.numero}</span>
                    <span>Entrou {fmtData(o.data_entrada)}</span>
                    {o.status_alterado_em && <span>{STATUS_INFO[o.status].curto} {tempoDesde(o.status_alterado_em)}</span>}
                    {o.data_previsao && (
                      <span className={`inline-flex items-center gap-1 ${prev === 'atrasada' ? 'text-red-600 font-bold' : prev === 'hoje' ? 'text-amber-700 font-semibold' : ''}`}>
                        <CalendarClock size={12} />
                        {prev === 'atrasada' ? 'Atrasada · ' : prev === 'hoje' ? 'Entrega hoje · ' : 'Entrega '}{fmtData(o.data_previsao)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="px-4 pb-4">
                  <BotoesStatus compacto osId={o.id} status={o.status} onAtualizado={s => atualizarStatusLocal(o.id, s)} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Resumo do mês (secundário) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500">Concluídas no mês</p>
          <p className="text-xl font-bold text-slate-800">{resumo.os_concluidas_mes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500">Comissão a receber</p>
          <p className="text-xl font-bold text-slate-800">{fmtMoeda(resumo.comissao_pendente)}</p>
        </div>
        {resumo.faturamento_gerado_mes != null && (
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500">Faturamento gerado</p>
            <p className="text-xl font-bold text-slate-800">{fmtMoeda(resumo.faturamento_gerado_mes)}</p>
          </div>
        )}
      </div>

      {comissoes_recentes.length > 0 && (
        <details className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer">Comissões recentes</summary>
          <ul className="divide-y divide-slate-50 text-sm">
            {comissoes_recentes.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-xs text-blue-700 w-20">{c.ordem_numero || '—'}</span>
                <span className="flex-1 font-semibold text-slate-700">{fmtMoeda(c.valor)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.pago ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {c.pago ? 'Pago' : 'Pendente'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {osAberta != null && (
        <OSMecanico osId={osAberta} onClose={() => { setOsAberta(null); carregar() }} onAlterado={carregar} />
      )}
    </div>
  )
}
