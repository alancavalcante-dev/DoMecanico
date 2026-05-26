import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Car, ClipboardList, X } from 'lucide-react'
import { dashboardAPI } from '../../api'
import { useDebounce } from '../../hooks/useDebounce'

interface Resultado {
  clientes: { id: number; nome: string; cpf_cnpj: string; telefone: string }[]
  veiculos: { id: number; placa: string; marca: string; modelo: string; cliente__nome: string }[]
  ordens: { id: number; numero: string; status: string; cliente__nome: string; veiculo__placa: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta', em_andamento: 'Em andamento', aguardando_peca: 'Aguard. peça',
  concluida: 'Concluída', cancelada: 'Cancelada',
}

export default function BuscaGlobal() {
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const q = useDebounce(query, 300)

  useEffect(() => {
    if (q.length < 2) { setResultado(null); return }
    setLoading(true)
    dashboardAPI.buscaGlobal(q)
      .then(({ data }) => setResultado(data))
      .finally(() => setLoading(false))
  }, [q])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const total = resultado
    ? resultado.clientes.length + resultado.veiculos.length + resultado.ordens.length
    : 0
  const semResultado = resultado && total === 0

  const ir = (path: string) => {
    setAberto(false)
    setQuery('')
    navigate(path)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setAberto(true) }}
          onFocus={() => query.length >= 2 && setAberto(true)}
          placeholder="Buscar clientes, veículos, OS..."
          className="w-full bg-slate-800 text-white text-sm pl-9 pr-8 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResultado(null) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            <X size={13} />
          </button>
        )}
      </div>

      {aberto && (query.length >= 2) && (
        <div className="absolute top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-96 overflow-y-auto">
          {loading && <p className="text-xs text-slate-400 px-4 py-3">Buscando...</p>}
          {semResultado && <p className="text-xs text-slate-400 px-4 py-3">Nenhum resultado para "{query}"</p>}

          {resultado && resultado.clientes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">Clientes</p>
              {resultado.clientes.map(c => (
                <button key={c.id} onClick={() => ir(`/clientes?id=${c.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 text-left">
                  <Users size={14} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.nome}</p>
                    {c.cpf_cnpj && <p className="text-xs text-slate-400">{c.cpf_cnpj}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {resultado && resultado.veiculos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">Veículos</p>
              {resultado.veiculos.map(v => (
                <button key={v.id} onClick={() => ir(`/veiculos?id=${v.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 text-left">
                  <Car size={14} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.placa} — {v.marca} {v.modelo}</p>
                    {v.cliente__nome && <p className="text-xs text-slate-400">{v.cliente__nome}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {resultado && resultado.ordens.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">Ordens de Serviço</p>
              {resultado.ordens.map(o => (
                <button key={o.id} onClick={() => ir(`/ordens/${o.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 text-left">
                  <ClipboardList size={14} className="text-violet-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">OS #{o.numero} — {o.veiculo__placa}</p>
                    <p className="text-xs text-slate-400">{o.cliente__nome} · {STATUS_LABEL[o.status] ?? o.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="h-2" />
        </div>
      )}
    </div>
  )
}
