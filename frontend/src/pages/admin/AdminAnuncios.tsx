import { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Anuncio { id: number; titulo: string; conteudo: string; tipo: string; ativo: boolean; criado_em: string }

const TIPOS = [
  { v: 'novidade', l: 'Novidade' },
  { v: 'correcao', l: 'Correção' },
  { v: 'aviso', l: 'Aviso' },
  { v: 'manutencao', l: 'Manutenção' },
]
const EMPTY = { titulo: '', conteudo: '', tipo: 'novidade', ativo: true }

export default function AdminAnuncios() {
  const [lista, setLista] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    adminAPI.anuncios().then(({ data }) => setLista(data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const salvar = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) { toast.error('Preencha título e conteúdo.'); return }
    setSalvando(true)
    try {
      if (form.id) await adminAPI.anuncioEditar(form.id, form)
      else await adminAPI.anuncioCriar(form)
      toast.success('Anúncio salvo!')
      setForm(null); carregar()
    } catch { toast.error('Erro ao salvar.') } finally { setSalvando(false) }
  }

  const toggleAtivo = async (a: Anuncio) => {
    try { await adminAPI.anuncioEditar(a.id, { ativo: !a.ativo }); carregar() } catch { toast.error('Erro.') }
  }
  const excluir = async (a: Anuncio) => {
    if (!confirm(`Excluir o anúncio "${a.titulo}"?`)) return
    try { await adminAPI.anuncioExcluir(a.id); carregar() } catch { toast.error('Erro.') }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Megaphone size={22} /> Anúncios</h1>
          <p className="text-gray-500 text-sm mt-1">Novidades/avisos que aparecem como popup para as oficinas.</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={16} /> Novo anúncio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" /></div>
      ) : lista.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum anúncio ainda. Crie o primeiro para avisar as oficinas.</p>
      ) : (
        <div className="space-y-2">
          {lista.map(a => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{a.titulo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{TIPOS.find(t => t.v === a.tipo)?.l || a.tipo}</span>
                    {!a.ativo && <span className="text-xs text-gray-500">(inativo)</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-1 whitespace-pre-line line-clamp-2">{a.conteudo}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleAtivo(a)} title={a.ativo ? 'Desativar' : 'Ativar'} className="p-1.5 rounded hover:bg-gray-800 text-gray-400">{a.ativo ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button onClick={() => setForm({ ...a })} title="Editar" className="p-1.5 rounded hover:bg-gray-800 text-blue-400"><Pencil size={16} /></button>
                  <button onClick={() => excluir(a)} title="Excluir" className="p-1.5 rounded hover:bg-gray-800 text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setForm(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">{form.id ? 'Editar anúncio' : 'Novo anúncio'}</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Título</label>
              <input value={form.titulo} onChange={e => setForm((p: any) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Atualização DoMecânico"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Conteúdo</label>
              <textarea rows={5} value={form.conteudo} onChange={e => setForm((p: any) => ({ ...p, conteudo: e.target.value }))} placeholder="Foi corrigido a Nota Fiscal, o filtro de busca..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-violet-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm((p: any) => ({ ...p, tipo: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
                  {TIPOS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mt-5">
                <input type="checkbox" checked={form.ativo} onChange={e => setForm((p: any) => ({ ...p, ativo: e.target.checked }))} /> Ativo
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setForm(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-2.5 text-sm">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
