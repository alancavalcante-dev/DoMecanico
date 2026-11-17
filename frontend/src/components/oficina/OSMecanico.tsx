import { useEffect, useMemo, useState } from 'react'
import { X, Search, Minus, Plus, PackagePlus, Wrench, Save, Trash2, MessageSquareWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordensAPI, catalogoAPI, pecasOSAPI } from '../../api'
import type { OrdemServico, PecaDisponivel, ServicoCatalogo, PecaOS } from '../../types'
import { useAuth, podeVerValores } from '../../contexts/AuthContext'
import BotaoMicrofone from '../ui/BotaoMicrofone'
import BotoesStatus from './BotoesStatus'
import FotosOS from './FotosOS'
import { STATUS_INFO, situacaoPrevisao, fmtData, fmtMoeda, type StatusOS } from './statusOficina'

interface Props {
  osId: number
  onClose: () => void
  /** Chamado quando algo muda (status, peças…) para a lista de fora recarregar. */
  onAlterado?: () => void
}

function Secao({ titulo, children, extra }: { titulo: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  )
}

/**
 * Tela da OS para o mecânico: tudo grande, por toque, sem o que não é dele
 * (desconto, excluir, PDF, garantia). Valores só se a oficina permitir.
 */
export default function OSMecanico({ osId, onClose, onAlterado }: Props) {
  const { user } = useAuth()
  const verValores = podeVerValores(user)
  const [os, setOs] = useState<OrdemServico | null>(null)
  const [pecas, setPecas] = useState<PecaDisponivel[]>([])
  const [catalogo, setCatalogo] = useState<ServicoCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)

  const [diagnostico, setDiagnostico] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvandoNotas, setSalvandoNotas] = useState(false)

  const [buscaPeca, setBuscaPeca] = useState('')
  const [pecaEscolhida, setPecaEscolhida] = useState<PecaDisponivel | null>(null)
  const [qtd, setQtd] = useState(1)
  const [precoAvulso, setPrecoAvulso] = useState('')
  const [lancando, setLancando] = useState(false)

  const [buscaServico, setBuscaServico] = useState('')

  const recarregar = async () => {
    const r = await ordensAPI.buscar(osId)
    setOs(r.data)
    return r.data as OrdemServico
  }

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    Promise.allSettled([ordensAPI.buscar(osId), ordensAPI.pecasDisponiveis(), catalogoAPI.listar({ ativo: 'true', page_size: 999 })])
      .then(([o, p, c]) => {
        if (!vivo) return
        if (o.status === 'rejected') { toast.error('OS não encontrada.'); onClose(); return }
        setOs(o.value.data)
        setDiagnostico(o.value.data.diagnostico || '')
        setObservacoes(o.value.data.observacoes || '')
        if (p.status === 'fulfilled') setPecas(p.value.data)
        if (c.status === 'fulfilled') setCatalogo(c.value.data.results ?? c.value.data)
      })
      .finally(() => vivo && setCarregando(false))
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId])

  // Trava o scroll do fundo enquanto a tela cheia está aberta.
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = antes; document.removeEventListener('keydown', esc) }
  }, [onClose])

  const notasAlteradas = !!os && (diagnostico !== (os.diagnostico || '') || observacoes !== (os.observacoes || ''))

  const salvarNotas = async () => {
    if (!os) return
    setSalvandoNotas(true)
    try {
      const r = await ordensAPI.patch(os.id, { diagnostico, observacoes })
      setOs(prev => prev ? { ...prev, diagnostico: r.data.diagnostico, observacoes: r.data.observacoes } : prev)
      toast.success('Anotações salvas!')
    } catch {
      toast.error('Erro ao salvar anotações.')
    } finally {
      setSalvandoNotas(false)
    }
  }

  const pecasFiltradas = useMemo(() => {
    const q = buscaPeca.trim().toLowerCase()
    if (!q) return []
    return pecas.filter(p => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q)).slice(0, 8)
  }, [buscaPeca, pecas])

  const servicosFiltrados = useMemo(() => {
    const q = buscaServico.trim().toLowerCase()
    const base = q ? catalogo.filter(c => c.nome.toLowerCase().includes(q) || c.categoria?.toLowerCase().includes(q)) : catalogo
    return base.slice(0, q ? 10 : 6)
  }, [buscaServico, catalogo])

  const limparPeca = () => { setBuscaPeca(''); setPecaEscolhida(null); setQtd(1); setPrecoAvulso('') }

  const lancarPeca = async (avulsa: boolean) => {
    if (!os) return
    setLancando(true)
    try {
      const payload: Record<string, unknown> = avulsa
        ? { descricao: buscaPeca.trim(), quantidade: qtd, ...(verValores && precoAvulso ? { preco_unitario: precoAvulso.replace(',', '.') } : {}) }
        : { peca: pecaEscolhida!.id, descricao: pecaEscolhida!.nome, quantidade: qtd }
      await ordensAPI.adicionarPeca(os.id, payload)
      toast.success('Peça lançada!')
      limparPeca()
      await recarregar()
      // Estoque mudou: atualiza saldo mostrado na busca.
      ordensAPI.pecasDisponiveis().then(r => setPecas(r.data)).catch(() => {})
      onAlterado?.()
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao lançar peça.')
    } finally {
      setLancando(false)
    }
  }

  const removerPeca = async (p: PecaOS) => {
    if (!window.confirm(`Tirar "${p.descricao}" da OS?`)) return
    try {
      await pecasOSAPI.deletar(p.id)
      await recarregar()
      onAlterado?.()
    } catch {
      toast.error('Erro ao remover peça.')
    }
  }

  const lancarServico = async (c: ServicoCatalogo) => {
    if (!os) return
    try {
      await ordensAPI.adicionarServico(os.id, { descricao: c.nome, quantidade: 1, preco_unitario: c.preco })
      toast.success('Serviço lançado!')
      setBuscaServico('')
      await recarregar()
      onAlterado?.()
    } catch {
      toast.error('Erro ao lançar serviço.')
    }
  }

  const prev = os ? situacaoPrevisao(os.data_previsao, os.status) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"
      aria-label={os ? `OS ${os.numero}` : 'Ordem de serviço'}>
      <div className="bg-slate-100 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho fixo */}
        <header className="bg-slate-900 text-white px-4 py-3 flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {os ? (
              <>
                <p className="font-mono text-3xl font-black tracking-wider leading-tight">{os.veiculo_placa}</p>
                <p className="text-slate-300 text-sm truncate">{os.veiculo_modelo} · {os.cliente_nome}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_INFO[os.status].cor}`}>{STATUS_INFO[os.status].label}</span>
                  <span className="text-slate-400">OS {os.numero}</span>
                  {os.quilometragem_entrada > 0 && <span className="text-slate-400">{os.quilometragem_entrada.toLocaleString('pt-BR')} km</span>}
                  {os.data_previsao && (
                    <span className={prev === 'atrasada' ? 'text-red-300 font-bold' : prev === 'hoje' ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                      Entrega {fmtData(os.data_previsao)}{prev === 'atrasada' ? ' (atrasada)' : prev === 'hoje' ? ' (hoje)' : ''}
                    </span>
                  )}
                </div>
              </>
            ) : <p className="text-lg font-semibold py-2">Carregando…</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20">
            <X size={24} />
          </button>
        </header>

        {carregando || !os ? (
          <div className="flex-1 flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {/* Queixa */}
            <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800 mb-1">
                <MessageSquareWarning size={14} /> Cliente relatou
              </p>
              <p className="text-base text-amber-950 whitespace-pre-line">{os.problema_relatado || '—'}</p>
            </div>

            <BotoesStatus osId={os.id} status={os.status}
              onAtualizado={(novo: StatusOS) => { setOs(p => p ? { ...p, status: novo } : p); onAlterado?.() }} />

            {/* Anotações */}
            <Secao titulo="O que encontrei / fiz">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="diag" className="text-sm font-medium text-slate-600">Diagnóstico</label>
                    <BotaoMicrofone valor={diagnostico} onChange={setDiagnostico} />
                  </div>
                  <textarea id="diag" rows={3} value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                    placeholder="Ex: pastilha dianteira no fim, disco ok…"
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="obs" className="text-sm font-medium text-slate-600">Observações</label>
                    <BotaoMicrofone valor={observacoes} onChange={setObservacoes} />
                  </div>
                  <textarea id="obs" rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)}
                    placeholder="Ex: avisar cliente que o pneu traseiro está careca"
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-blue-500" />
                </div>
                {notasAlteradas && (
                  <button type="button" onClick={salvarNotas} disabled={salvandoNotas}
                    className="w-full min-h-12 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60">
                    <Save size={18} /> {salvandoNotas ? 'Salvando…' : 'Salvar anotações'}
                  </button>
                )}
              </div>
            </Secao>

            {/* Peças */}
            <Secao titulo="Peças usadas">
              {(os.pecas_usadas?.length ?? 0) > 0 && (
                <ul className="divide-y divide-slate-100 mb-3">
                  {os.pecas_usadas!.map(p => (
                    <li key={p.id} className="flex items-center gap-2 py-2.5">
                      <span className="w-10 text-center font-bold text-slate-700">{parseFloat(p.quantidade)}×</span>
                      <span className="flex-1 text-slate-800">{p.descricao}</span>
                      {verValores && p.total != null && <span className="text-sm text-slate-500">{fmtMoeda(p.total)}</span>}
                      <button type="button" onClick={() => removerPeca(p)} aria-label={`Remover ${p.descricao}`}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pecaEscolhida ? (
                <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{pecaEscolhida.nome}</p>
                      <p className="text-xs text-slate-500">
                        {pecaEscolhida.codigo} · Estoque: {parseFloat(pecaEscolhida.quantidade)} {pecaEscolhida.unidade}
                        {pecaEscolhida.localizacao ? ` · ${pecaEscolhida.localizacao}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={limparPeca} aria-label="Cancelar peça" className="p-2 text-slate-500"><X size={18} /></button>
                  </div>
                  <Quantidade qtd={qtd} setQtd={setQtd} />
                  <button type="button" onClick={() => lancarPeca(false)} disabled={lancando}
                    className="w-full min-h-12 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-60">
                    {lancando ? 'Lançando…' : `Lançar ${qtd}× na OS`}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={buscaPeca} onChange={e => setBuscaPeca(e.target.value)} type="search"
                      placeholder="Buscar peça pelo nome ou código"
                      aria-label="Buscar peça"
                      className="w-full min-h-12 border-2 border-slate-200 rounded-lg pl-10 pr-3 text-base focus:outline-none focus:border-blue-500" />
                  </div>
                  {pecasFiltradas.length > 0 && (
                    <ul className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                      {pecasFiltradas.map(p => {
                        const saldo = parseFloat(p.quantidade)
                        return (
                          <li key={p.id}>
                            <button type="button" disabled={saldo <= 0} onClick={() => { setPecaEscolhida(p); setQtd(1) }}
                              className="w-full text-left px-3 py-3 hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2">
                              <span className="flex-1">
                                <span className="block text-slate-800">{p.nome}</span>
                                <span className="block text-xs text-slate-500">{p.codigo}{p.marca ? ` · ${p.marca}` : ''}</span>
                              </span>
                              <span className={`text-xs font-semibold ${saldo <= 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                {saldo <= 0 ? 'sem estoque' : `${saldo} ${p.unidade}`}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {buscaPeca.trim().length >= 3 && (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 space-y-2">
                      <p className="text-sm text-slate-600">Não é do estoque? Lançar <b>“{buscaPeca.trim()}”</b> como peça avulsa:</p>
                      <Quantidade qtd={qtd} setQtd={setQtd} />
                      {verValores && (
                        <input value={precoAvulso} onChange={e => setPrecoAvulso(e.target.value)} inputMode="decimal"
                          placeholder="Preço unitário (opcional)" aria-label="Preço unitário"
                          className="w-full min-h-12 border-2 border-slate-200 rounded-lg px-3 text-base focus:outline-none focus:border-blue-500" />
                      )}
                      <button type="button" onClick={() => lancarPeca(true)} disabled={lancando}
                        className="w-full min-h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-700 text-slate-800 font-semibold disabled:opacity-60">
                        <PackagePlus size={18} /> Lançar peça avulsa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Secao>

            {/* Serviços */}
            <Secao titulo="Serviços">
              {(os.servicos?.length ?? 0) > 0 ? (
                <ul className="divide-y divide-slate-100 mb-3">
                  {os.servicos!.map(s => (
                    <li key={s.id} className="flex items-center gap-2 py-2.5">
                      <Wrench size={16} className="text-slate-400 shrink-0" />
                      <span className="flex-1 text-slate-800">{s.descricao}</span>
                      {verValores && s.total != null && <span className="text-sm text-slate-500">{fmtMoeda(s.total)}</span>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400 mb-3">Nenhum serviço lançado ainda.</p>}
              {catalogo.length > 0 && (
                <>
                  <input value={buscaServico} onChange={e => setBuscaServico(e.target.value)} type="search"
                    placeholder="Lançar serviço do catálogo…" aria-label="Buscar serviço do catálogo"
                    className="w-full min-h-12 border-2 border-slate-200 rounded-lg px-3 text-base focus:outline-none focus:border-blue-500" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {servicosFiltrados.map(c => (
                      <button key={c.id} type="button" onClick={() => lancarServico(c)}
                        className="min-h-11 px-3 rounded-full border-2 border-slate-200 bg-white text-sm text-slate-700 hover:border-blue-400 hover:bg-blue-50">
                        + {c.nome}{verValores ? ` · ${fmtMoeda(c.preco)}` : ''}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Secao>

            {/* Fotos */}
            <Secao titulo={`Fotos${os.fotos?.length ? ` (${os.fotos.length})` : ''}`}>
              <FotosOS ordemId={os.id} fotos={os.fotos ?? []} grande
                onChange={fotos => setOs(p => p ? { ...p, fotos } : p)} />
            </Secao>

            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  )
}

function Quantidade({ qtd, setQtd }: { qtd: number; setQtd: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">Quantidade</span>
      <div className="flex items-center ml-auto">
        <button type="button" onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Diminuir quantidade"
          className="w-12 h-12 flex items-center justify-center rounded-l-lg border-2 border-slate-300 bg-white"><Minus size={18} /></button>
        <span className="w-14 h-12 flex items-center justify-center border-y-2 border-slate-300 bg-white text-lg font-bold" aria-live="polite">{qtd}</span>
        <button type="button" onClick={() => setQtd(qtd + 1)} aria-label="Aumentar quantidade"
          className="w-12 h-12 flex items-center justify-center rounded-r-lg border-2 border-slate-300 bg-white"><Plus size={18} /></button>
      </div>
    </div>
  )
}
