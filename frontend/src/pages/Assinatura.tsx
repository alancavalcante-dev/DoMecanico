import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Check, X, AlertTriangle, RefreshCw, Loader2, Receipt, Copy, CheckCircle, ChevronDown, ChevronUp, LifeBuoy, Building2, MessageCircle } from 'lucide-react'

interface PagInfo { manual: boolean; pix_chave: string; pix_favorecido: string; pix_qrcode: string; whatsapp: string }


interface Plano {
  id: number
  slug: string
  nome: string
  preco: string
  max_usuarios: number
  max_clientes: number
  max_os_mes: number
  max_pecas: number
  tem_nota_fiscal: boolean
  tem_relatorios: boolean
  tem_fotos_veiculo: boolean
  modulos_disponiveis: string[]
  descricao: string
  destaque: boolean
}

interface Assinatura {
  status: string
  status_display: string
  ativa: boolean
  vencida: boolean
  em_carencia: boolean
  dias_ate_bloqueio: number | null
  dias_trial_restantes: number
  data_fim: string | null
  plano: Plano
}

interface Fatura {
  id: number
  numero: string
  valor: string
  status: string
  vencimento: string
  criado_em: string | null
  data_pagamento: string | null
  metodo_pagamento: string
  link_pagamento: string
}

const STATUS_FATURA: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  paga:     { label: 'Paga',     cls: 'bg-green-100 text-green-700' },
  vencida:  { label: 'Vencida',  cls: 'bg-red-100 text-red-700' },
  cancelada:{ label: 'Cancelada',cls: 'bg-slate-100 text-slate-600' },
}

const getRecursos = (p: Plano): { texto: string; ativo: boolean }[] => {
  const items: { texto: string; ativo: boolean }[] = [
    { texto: p.max_clientes === -1 ? 'Clientes ilimitados' : `Até ${p.max_clientes} clientes`, ativo: true },
    { texto: p.max_usuarios === -1 ? 'Usuários ilimitados' : `Até ${p.max_usuarios} usuários`, ativo: true },
  ]
  if (p.max_os_mes !== undefined) items.push({ texto: p.max_os_mes === -1 ? 'OS ilimitadas/mês' : `Até ${p.max_os_mes} OS/mês`, ativo: true })
  if (p.max_pecas !== undefined) items.push({ texto: p.max_pecas === -1 ? 'Peças ilimitadas' : `Até ${p.max_pecas} peças no estoque`, ativo: true })
  items.push({ texto: 'Comprovante de serviço', ativo: p.tem_nota_fiscal })
  items.push({ texto: 'Relatórios avançados', ativo: p.tem_relatorios })
  items.push({ texto: 'Fotos de veículos', ativo: p.tem_fotos_veiculo })
  return items
}

export default function Assinatura() {
  const { refreshUser, user } = useAuth()
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState('')
  const [loadingLink, setLoadingLink] = useState(false)
  const [showPagar, setShowPagar] = useState(false)
  const [pixData, setPixData] = useState<{ link_pagamento: string; pix_copia_cola: string } | null>(null)
  const [pixCopiado, setPixCopiado] = useState(false)
  const [chaveCopiada, setChaveCopiada] = useState(false)
  const [pagInfo, setPagInfo] = useState<PagInfo | null>(null)
  const [pago, setPago] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<number | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<string, boolean>>({})

  const carregarFaturas = () =>
    authAPI.minhasFaturas().then(({ data }) => setFaturas(data)).catch(() => {})

  useEffect(() => {
    authAPI.assinatura().then(({ data }) => {
      setAssinatura(data)
      setPlanoSelecionado(data.plano?.slug || '')
    })
    authAPI.planos().then(({ data }) => setPlanos(data))
    authAPI.pagamentoInfo().then(({ data }) => setPagInfo(data)).catch(() => {})
    carregarFaturas()
  }, [])

  // Enquanto o QR do PIX está na tela, checa a cada 5s se o pagamento entrou.
  useEffect(() => {
    if (!pixData || pago) return
    const inicial = assinatura?.data_fim ?? null
    const iv = setInterval(async () => {
      try {
        const { data } = await authAPI.assinatura()
        if (data.data_fim !== inicial && (data.ativa || data.status === 'ativa')) {
          setAssinatura(data)
          setPago(true)
          clearInterval(iv)
        }
      } catch { /* ignora e tenta de novo */ }
    }, 5000)
    const stop = setTimeout(() => clearInterval(iv), 10 * 60 * 1000)
    return () => { clearInterval(iv); clearTimeout(stop) }
  }, [pixData, pago])

  const cancelarFatura = async (f: Fatura) => {
    if (!window.confirm(`Cancelar a fatura ${f.numero}?`)) return
    setCancelando(f.id)
    try {
      await authAPI.cancelarFatura(f.id)
      toast.success('Fatura cancelada.')
      carregarFaturas()
    } catch {
      toast.error('Erro ao cancelar fatura.')
    } finally {
      setCancelando(null)
    }
  }

  const copiarLink = (f: Fatura) => {
    navigator.clipboard.writeText(f.link_pagamento).then(() => {
      setLinkCopiado(f.id)
      setTimeout(() => setLinkCopiado(null), 2000)
    })
  }

  const fecharPagar = () => { setShowPagar(false); setPixData(null); setPixCopiado(false); setPago(false) }

  const copiarChave = () => {
    if (!pagInfo?.pix_chave) return
    navigator.clipboard.writeText(pagInfo.pix_chave).then(() => {
      setChaveCopiada(true)
      setTimeout(() => setChaveCopiada(false), 2000)
    })
  }

  const copiarPix = () => {
    if (!pixData?.pix_copia_cola) return
    navigator.clipboard.writeText(pixData.pix_copia_cola).then(() => {
      setPixCopiado(true)
      setTimeout(() => setPixCopiado(false), 2000)
    })
  }

  const atualizarStatus = async () => {
    try {
      const { data } = await authAPI.assinatura()
      setAssinatura(data)
      await refreshUser()
      toast.success(data.ativa ? 'Pagamento confirmado! Assinatura ativa.' : 'Ainda não identificamos o pagamento. Tente em instantes.')
    } catch {
      toast.error('Não foi possível atualizar o status.')
    }
  }

  const handleGerarLink = async () => {
    setLoadingLink(true)
    try {
      const { data } = await authAPI.gerarLinkPagamento({ plano_slug: planoSelecionado })
      if (data.link_pagamento || data.pix_copia_cola) {
        setPixData({ link_pagamento: data.link_pagamento || '', pix_copia_cola: data.pix_copia_cola || '' })
        carregarFaturas()
      } else {
        toast.error('Não foi possível gerar a cobrança PIX.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.erro || 'Erro ao gerar cobrança PIX.'
      toast.error(msg)
    } finally {
      setLoadingLink(false)
    }
  }

  const handleTrocarPlano = async (slug: string) => {
    try {
      await authAPI.trocarPlano({ plano_slug: slug })
      await refreshUser()
      const { data } = await authAPI.assinatura()
      setAssinatura(data)
      toast.success('Plano alterado com sucesso!')
    } catch {
      toast.error('Erro ao trocar plano.')
    }
  }

  const fmt = (v: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

  // Rótulo/cor derivados do estado REAL (não do campo status cru, que pode estar
  // desatualizado até o comando expirar_assinaturas rodar).
  const statusInfo = !assinatura
    ? { label: '', cls: 'text-slate-500' }
    : !assinatura.ativa
    ? { label: 'Vencida', cls: 'text-red-600' }
    : assinatura.em_carencia
    ? { label: 'Em carência', cls: 'text-amber-600' }
    : assinatura.status === 'trial'
    ? { label: assinatura.status_display, cls: 'text-amber-600' }
    : { label: 'Ativa', cls: 'text-green-600' }

  if (user && user.papel !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Assinatura</h1>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-600 text-sm">
            Apenas o <strong>administrador da oficina</strong> pode gerenciar a assinatura e os pagamentos.
            Fale com o responsável para regularizar.
          </p>
          <Link to="/suporte" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium">
            <LifeBuoy className="w-4 h-4" /> Falar com o Suporte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assinatura</h1>

      {assinatura && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">Plano atual</p>
              <p className="text-slate-800 font-bold text-xl">{assinatura.plano?.nome}</p>
              <p className="text-slate-500 text-sm mt-1">
                {fmt(assinatura.plano?.preco)}/mês
              </p>
            </div>
            <span className={`font-semibold text-lg ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Trial vigente */}
          {assinatura.status === 'trial' && assinatura.ativa && !assinatura.em_carencia && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Período de teste: <strong>{assinatura.dias_trial_restantes} dias restantes</strong>.
                Assine para continuar usando após o trial.
              </span>
            </div>
          )}

          {/* Vencida, mas ainda com acesso pela carência */}
          {assinatura.em_carencia && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Seu plano venceu. Você tem <strong>{assinatura.dias_ate_bloqueio} dia(s)</strong> para
                renovar antes de perder o acesso ao sistema.
              </span>
            </div>
          )}

          {/* Bloqueada — vencida além da carência ou trial encerrado */}
          {!assinatura.ativa && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {assinatura.status === 'trial'
                  ? 'Seu período de teste terminou. Assine um plano para reativar o acesso.'
                  : 'Seu plano venceu e o acesso foi bloqueado. Renove para reativar o sistema.'}
              </span>
            </div>
          )}

          {assinatura.data_fim && assinatura.status !== 'trial' && (
            <p className={`text-sm mt-3 ${assinatura.ativa ? 'text-slate-400' : 'text-red-500'}`}>
              {assinatura.ativa
                ? `Válida até: ${new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}`
                : `Venceu em: ${new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}`}
            </p>
          )}

          <button
            onClick={() => setShowPagar(true)}
            className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            <CreditCard className="w-4 h-4" /> Pagar / Renovar assinatura
          </button>
        </div>
      )}

      {/* Ajuda rápida: suporte + dados da oficina (acessíveis mesmo com acesso bloqueado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Link
          to="/suporte"
          className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm transition"
        >
          <div className="bg-blue-50 text-blue-600 rounded-xl p-2.5 shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-800 font-semibold text-sm">Falar com o Suporte</p>
            <p className="text-slate-500 text-xs">Problema com pagamento ou acesso? Fale com a gente.</p>
          </div>
        </Link>
        <Link
          to="/perfil"
          className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm transition"
        >
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-2.5 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-800 font-semibold text-sm">Dados da Oficina</p>
            <p className="text-slate-500 text-xs">Corrija CNPJ, endereço e outros dados do cadastro.</p>
          </div>
        </Link>
      </div>

      {/* Trocar plano */}
      <h2 className="text-slate-800 font-semibold mb-4">{planos.length > 1 ? 'Alterar plano' : 'Seu plano'}</h2>
      <div className={`grid gap-4 mb-6 ${planos.length > 1 ? 'sm:grid-cols-2' : ''} grid-cols-1`}>
        {planos.map((p) => {
          const atual = p.slug === assinatura?.plano?.slug
          const modulos = p.modulos_disponiveis || []
          const expandido = modulosExpandidos[p.slug] ?? false
          return (
            <div
              key={p.slug}
              className={`rounded-2xl border-2 p-6 ${
                atual ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              } shadow-sm`}
            >
              {p.destaque && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
              <div className="text-slate-800 font-bold text-lg mt-1">{p.nome}</div>
              <div className="text-blue-600 font-bold text-2xl">
                {fmt(p.preco)}<span className="text-sm text-slate-500 font-normal">/mês</span>
              </div>

              <ul className="mt-3 space-y-1 text-sm mb-3">
                {getRecursos(p).map((b, i) => (
                  <li key={i} className={`flex items-center gap-2 ${b.ativo ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {b.ativo
                      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
                      : <X className="w-4 h-4 text-slate-400 shrink-0" />
                    }
                    {b.texto}
                  </li>
                ))}
              </ul>

              {modulos.length > 0 && (
                <div className="border-t border-slate-200 pt-3 mb-4">
                  <button
                    onClick={() => setModulosExpandidos(prev => ({ ...prev, [p.slug]: !expandido }))}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandido ? 'Ocultar módulos' : `Ver ${modulos.length} módulos incluídos`}
                  </button>
                  {expandido && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {modulos.map((m, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-600">
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {atual ? (
                <span className="text-blue-600 text-sm font-semibold">Plano atual</span>
              ) : (
                <button
                  onClick={() => handleTrocarPlano(p.slug)}
                  className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-3 h-3" /> Trocar para {p.nome}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Histórico de faturas */}
      <div className="mt-8">
        <h2 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
          <Receipt size={17} /> Histórico de Faturas
        </h2>
        {faturas.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium">Nº Fatura</th>
                    <th className="text-left px-4 py-3 font-medium">Valor</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Criado em</th>
                    <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                    <th className="text-left px-4 py-3 font-medium">Pagamento</th>
                    <th className="text-left px-4 py-3 font-medium">Link</th>
                    <th className="text-left px-4 py-3 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faturas.map(f => {
                    const badge = STATUS_FATURA[f.status] || { label: f.status, cls: 'bg-slate-100 text-slate-600' }
                    const fmtDt = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                    const fmtD = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.numero}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{fmt(f.valor)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDt(f.criado_em)}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtD(f.vencimento)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {f.data_pagamento ? fmtDt(f.data_pagamento) : '—'}
                          {f.metodo_pagamento && <span className="ml-1 text-slate-400">({f.metodo_pagamento})</span>}
                        </td>
                        <td className="px-4 py-3">
                          {f.link_pagamento && f.status === 'pendente' ? (
                            <button onClick={() => copiarLink(f)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500">
                              {linkCopiado === f.id ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                              {linkCopiado === f.id ? 'Copiado' : 'Copiar link'}
                            </button>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {f.status === 'pendente' && (
                            <button
                              onClick={() => cancelarFatura(f)}
                              disabled={cancelando === f.id}
                              className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                            >
                              {cancelando === f.id ? '...' : 'Cancelar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal pagamento */}
      {showPagar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-slate-200 shadow-xl">
            <h3 className="text-slate-800 font-bold text-xl mb-6">Pagar via PIX</h3>

            {pagInfo === null ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : pagInfo.manual ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Faça um PIX do valor do plano para a chave abaixo e nos envie o comprovante
                  no WhatsApp — ativamos sua assinatura na hora.
                </p>

                <div>
                  <label className="block text-sm text-slate-500 mb-1">Plano</label>
                  <select
                    value={planoSelecionado}
                    onChange={(e) => setPlanoSelecionado(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-4 py-2.5"
                  >
                    {planos.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.nome} — {fmt(p.preco)}/mês</option>
                    ))}
                  </select>
                </div>

                {pagInfo.pix_qrcode && (
                  <div className="flex justify-center">
                    <img src={pagInfo.pix_qrcode} alt="QR Code PIX"
                      className="w-48 h-48 border border-slate-200 rounded-lg bg-white object-contain p-1" />
                  </div>
                )}

                {pagInfo.pix_chave ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Chave PIX</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-slate-800 break-all">{pagInfo.pix_chave}</code>
                        <button onClick={copiarChave} className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500">
                          {chaveCopiada ? <><CheckCircle size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                        </button>
                      </div>
                    </div>
                    {pagInfo.pix_favorecido && (
                      <div>
                        <p className="text-xs text-slate-500">Favorecido</p>
                        <p className="text-sm text-slate-800 font-medium">{pagInfo.pix_favorecido}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    O pagamento manual ainda não foi configurado no painel. Fale com o suporte.
                  </p>
                )}

                {pagInfo.whatsapp && (
                  <a
                    href={`https://wa.me/${pagInfo.whatsapp}?text=${encodeURIComponent('Olá! Paguei a assinatura do DoMecânico via PIX e estou enviando o comprovante.')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 transition text-sm"
                  >
                    <MessageCircle size={16} /> Enviar comprovante no WhatsApp
                  </a>
                )}

                <button
                  onClick={fecharPagar}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 transition text-sm"
                >
                  Fechar
                </button>
              </div>
            ) : !pixData ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Plano</label>
                    <select
                      value={planoSelecionado}
                      onChange={(e) => setPlanoSelecionado(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-4 py-2.5"
                    >
                      {planos.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.nome} — {fmt(p.preco)}/mês
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGerarLink}
                  disabled={loadingLink || !planoSelecionado}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition text-sm"
                >
                  {loadingLink ? (
                    <><Loader2 size={15} className="animate-spin" /> Gerando PIX...</>
                  ) : (
                    <><CreditCard size={15} /> Gerar cobrança PIX</>
                  )}
                </button>

                <button
                  onClick={fecharPagar}
                  className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 transition text-sm"
                >
                  Cancelar
                </button>
              </>
            ) : pago ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-slate-800 font-bold text-lg">Pagamento confirmado!</p>
                <p className="text-slate-500 text-sm mt-1">Sua assinatura está ativa. 🎉</p>
                <button onClick={fecharPagar}
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4 text-center">
                  Escaneie o QR Code ou copie o código no app do seu banco. Assim que
                  você pagar, a confirmação aparece aqui automaticamente.
                </p>

                {pixData.link_pagamento && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={pixData.link_pagamento}
                      alt="QR Code PIX"
                      className="w-52 h-52 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                )}

                {pixData.pix_copia_cola && (
                  <div className="mb-4">
                    <label className="block text-sm text-slate-500 mb-1">PIX copia e cola</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={pixData.pix_copia_cola}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 min-w-0 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                      />
                      <button
                        onClick={copiarPix}
                        className="shrink-0 flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3 text-sm"
                      >
                        {pixCopiado ? <CheckCircle size={15} /> : <Copy size={15} />}
                        {pixCopiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-3">
                  <Loader2 size={13} className="animate-spin" /> Aguardando confirmação do pagamento…
                </div>

                <button
                  onClick={atualizarStatus}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg py-3 transition text-sm"
                >
                  <RefreshCw size={15} /> Já paguei — atualizar status
                </button>

                <button
                  onClick={fecharPagar}
                  className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 transition text-sm"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
