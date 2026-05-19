import { useEffect, useState } from 'react'
import { notasAPI, ordensAPI } from '../api'
import type { NotaFiscal, OrdemServico } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Printer, Search, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotasFiscais() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [ordensDisponiveis, setOrdensDisponiveis] = useState<OrdemServico[]>([])
  const [form, setForm] = useState({ ordem: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)
  const [search, setSearch] = useState('')

  const carregar = async () => {
    setLoading(true)
    try {
      const r = await notasAPI.listar()
      setNotas(r.data.results ?? r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirNova = async () => {
    const r = await ordensAPI.listar({ status: 'concluida', page_size: 999 })
    const ordens = r.data.results ?? r.data
    const notasOrdens = notas.map(n => n.ordem)
    setOrdensDisponiveis(ordens.filter((o: OrdemServico) => !notasOrdens.includes(o.id)))
    setForm({ ordem: '', observacoes: '' })
    setModalOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await notasAPI.criar(form)
      toast.success('Nota fiscal gerada!')
      setModalOpen(false)
      carregar()
    } catch (err: any) {
      const msg = err?.response?.data?.erro || err?.response?.data?.detail || 'Erro ao gerar nota fiscal.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  const imprimir = async (nf: NotaFiscal) => {
    try {
      const r = await notasAPI.imprimir(nf.id)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao imprimir nota.')
    }
  }

  const notasFiltradas = notas.filter(n =>
    !search || n.numero_nota.toLowerCase().includes(search.toLowerCase()) ||
    (n.cliente_nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.ordem_numero || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Notas Fiscais"
        subtitle={`${notas.length} nota(s) emitida(s)`}
        action={
          <button onClick={abrirNova} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Gerar Nota Fiscal
          </button>
        }
      />

      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nº nota, cliente, OS..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : notasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FileText size={40} className="mb-3" />
            <p className="text-sm">Nenhuma nota fiscal encontrada.</p>
            <p className="text-xs mt-1">Gere notas a partir de OS concluídas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nº Nota</th>
                <th className="px-5 py-3 text-left">OS Ref.</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-left">Emissão</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {notasFiltradas.map(nf => (
                <tr key={nf.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono font-bold text-blue-700">{nf.numero_nota}</td>
                  <td className="px-5 py-3 font-mono text-slate-600">{nf.ordem_numero}</td>
                  <td className="px-5 py-3 text-slate-700">{nf.cliente_nome}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(nf.data_emissao).toLocaleString('pt-BR')}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => imprimir(nf)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                        <Printer size={13} /> Imprimir PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Gerar Nota Fiscal" size="sm">
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Ordem de Serviço Concluída *</label>
            {ordensDisponiveis.length === 0 ? (
              <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                Não há OS concluídas disponíveis para emissão de nota fiscal.
              </p>
            ) : (
              <select required value={form.ordem} onChange={e => setForm(p => ({ ...p, ordem: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {ordensDisponiveis.map(os => (
                  <option key={os.id} value={os.id}>{os.numero} — {os.cliente_nome} ({os.veiculo_placa})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Observações</label>
            <textarea rows={3} value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={salvando || ordensDisponiveis.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Gerando...' : 'Gerar Nota'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
