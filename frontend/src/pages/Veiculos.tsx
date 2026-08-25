import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesAPI, veiculosAPI } from '../api'
import type { Cliente, Veiculo, FotoVeiculo } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { tipoBadge, statusBadge } from '../components/ui/Badge'
import { Plus, Search, Pencil, Trash2, Camera, X, Image, HeartPulse, History, Wrench, Package, CircleDollarSign, CalendarClock, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProntuarioItem {
  id: number
  numero: string
  status: string
  status_display: string
  data_entrada: string
  data_conclusao: string | null
  quilometragem_entrada: number
  quilometragem_saida: number | null
  mecanico_nome: string | null
  problema_relatado: string
  diagnostico: string
  total_geral: string
  servicos: { descricao: string; quantidade: string }[]
  pecas: { descricao: string; quantidade: string }[]
}

interface Prontuario {
  veiculo: { id: number; placa: string; marca: string; modelo: string; ano: number | null; cor: string; quilometragem: number; cliente_nome: string }
  total_ordens: number
  total_concluidas: number
  total_gasto: string
  ultima_visita: string | null
  timeline: ProntuarioItem[]
}

function fmtMoeda(v: string | number | undefined) {
  if (v == null) return 'R$ 0,00'
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const TIPOS = ['carro', 'moto', 'caminhao', 'outro']

const EMPTY = {
  cliente: '', tipo: 'carro', marca: '', modelo: '',
  ano: '', placa: '', cor: '', quilometragem: '0', chassi: '', observacoes: '',
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [fotosModal, setFotosModal] = useState<Veiculo | null>(null)
  const [editando, setEditando] = useState<Veiculo | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [salvando, setSalvando] = useState(false)
  const [uploadingFotos, setUploadingFotos] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [prontOpen, setProntOpen] = useState(false)
  const [prontData, setProntData] = useState<Prontuario | null>(null)
  const [prontLoading, setProntLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const carregar = async (s = search) => {
    setLoading(true)
    try {
      const [vRes, cRes] = await Promise.all([
        veiculosAPI.listar({ search: s || undefined }),
        clientesAPI.listar({ page_size: 999 }),
      ])
      setVeiculos(vRes.data.results ?? vRes.data)
      setClientes(cRes.data.results ?? cRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm({ ...EMPTY }); setModalOpen(true) }
  const navigate = useNavigate()

  const abrirEditar = (v: Veiculo) => {
    setEditando(v)
    setForm({
      cliente: String(v.cliente), tipo: v.tipo, marca: v.marca, modelo: v.modelo,
      ano: v.ano ? String(v.ano) : '', placa: v.placa, cor: v.cor,
      quilometragem: String(v.quilometragem), chassi: v.chassi, observacoes: v.observacoes,
    })
    setModalOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = { ...form, ano: form.ano ? parseInt(form.ano) : null, quilometragem: parseInt(form.quilometragem) || 0 }
      if (editando) {
        await veiculosAPI.atualizar(editando.id, payload)
        toast.success('Veículo atualizado!')
      } else {
        await veiculosAPI.criar(payload)
        toast.success('Veículo cadastrado!')
      }
      setModalOpen(false)
      carregar()
    } catch (err: any) {
      const msg = err.response?.data?.placa?.[0] || 'Erro ao salvar veículo.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (v: Veiculo) => {
    if (!confirm(`Excluir veículo ${v.placa}?`)) return
    try {
      await veiculosAPI.deletar(v.id)
      toast.success('Veículo removido.')
      carregar()
    } catch {
      toast.error('Erro ao remover veículo.')
    }
  }

  const gerarSaude = async (v: Veiculo) => {
    try {
      const r = await veiculosAPI.saudePDF(v.id)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar relatório de saúde.')
    }
  }

  const abrirProntuario = async (v: Veiculo) => {
    setProntData(null)
    setProntLoading(true)
    setProntOpen(true)
    try {
      const r = await veiculosAPI.historico(v.id)
      setProntData(r.data)
    } catch {
      toast.error('Erro ao carregar prontuário.')
      setProntOpen(false)
    } finally {
      setProntLoading(false)
    }
  }

  const abrirFotos = async (v: Veiculo) => {
    const r = await veiculosAPI.buscar(v.id)
    setFotosModal(r.data)
  }

  const uploadFotos = async (files: FileList | null) => {
    if (!files || !fotosModal) return
    setUploadingFotos(true)
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('fotos', f))
    try {
      await veiculosAPI.uploadFotos(fotosModal.id, fd)
      toast.success(`${files.length} foto(s) enviada(s)!`)
      const r = await veiculosAPI.buscar(fotosModal.id)
      setFotosModal(r.data)
    } catch {
      toast.error('Erro ao enviar fotos.')
    } finally {
      setUploadingFotos(false)
    }
  }

  const deletarFoto = async (foto: FotoVeiculo) => {
    if (!fotosModal || !confirm('Excluir esta foto?')) return
    try {
      await veiculosAPI.deletarFoto(fotosModal.id, foto.id)
      toast.success('Foto removida.')
      const r = await veiculosAPI.buscar(fotosModal.id)
      setFotosModal(r.data)
    } catch {
      toast.error('Erro ao remover foto.')
    }
  }

  const buscar = (e: React.FormEvent) => { e.preventDefault(); carregar(search) }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <PageHeader
        title="Veículos"
        subtitle={`${veiculos.length} cadastrado(s)`}
        action={
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo Veículo
          </button>
        }
      />

      <form onSubmit={buscar} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Placa, marca, modelo, cliente..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Buscar</button>
        {search && <button type="button" onClick={() => { setSearch(''); carregar('') }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Limpar</button>}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : veiculos.length === 0 ? (
          <p className="text-center text-slate-400 py-16 text-sm">Nenhum veículo encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Placa</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Veículo</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Ano</th>
                <th className="px-4 py-3 text-left">KM</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {veiculos.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{v.placa}</td>
                  <td className="px-4 py-3">{tipoBadge(v.tipo)}</td>
                  <td className="px-4 py-3 text-slate-700">{v.marca} {v.modelo}</td>
                  <td className="px-4 py-3 text-slate-500">{v.cliente_nome}</td>
                  <td className="px-4 py-3 text-slate-500">{v.ano || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{Number(v.quilometragem).toLocaleString('pt-BR')} km</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/diagnosticos?veiculo=${v.id}`)} title="Nova avaliação" className="p-1.5 rounded hover:bg-sky-50 text-sky-600"><Stethoscope size={15} /></button>
                      <button onClick={() => abrirProntuario(v)} title="Prontuário / Histórico" className="p-1.5 rounded hover:bg-amber-50 text-amber-600"><History size={15} /></button>
                      <button onClick={() => gerarSaude(v)} title="Relatório de Saúde" className="p-1.5 rounded hover:bg-green-50 text-green-600"><HeartPulse size={15} /></button>
                      <button onClick={() => abrirFotos(v)} title="Fotos" className="p-1.5 rounded hover:bg-purple-50 text-purple-600"><Camera size={15} /></button>
                      <button onClick={() => abrirEditar(v)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => deletar(v)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Veículo' : 'Novo Veículo'} size="lg">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Cliente *</label>
              <select required value={form.cliente} onChange={f('cliente')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Tipo *</label>
              <select required value={form.tipo} onChange={f('tipo')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Placa *</label>
              <input required value={form.placa} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Marca *</label>
              <input required value={form.marca} onChange={f('marca')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Modelo *</label>
              <input required value={form.modelo} onChange={f('modelo')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ano</label>
              <input type="number" value={form.ano} onChange={f('ano')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Cor</label>
              <input value={form.cor} onChange={f('cor')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Quilometragem</label>
              <input type="number" value={form.quilometragem} onChange={f('quilometragem')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Chassi</label>
              <input value={form.chassi} onChange={f('chassi')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <textarea rows={2} value={form.observacoes} onChange={f('observacoes')}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Fotos */}
      <Modal open={!!fotosModal} onClose={() => setFotosModal(null)} title={`Fotos — ${fotosModal?.placa} ${fotosModal?.marca} ${fotosModal?.modelo}`} size="xl">
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={32} className="mx-auto text-blue-400 mb-2" />
            <p className="text-sm text-slate-500">Clique para selecionar fotos</p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — múltiplas fotos permitidas</p>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => uploadFotos(e.target.files)} />
          </div>
          {uploadingFotos && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Enviando fotos...
            </div>
          )}
          {fotosModal?.fotos && fotosModal.fotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotosModal.fotos.map(foto => (
                <div key={foto.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={foto.foto}
                    alt={foto.descricao || 'Foto do veículo'}
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => setFotoPreview(foto.foto)}
                  />
                  {foto.descricao && (
                    <p className="px-2 py-1 text-xs text-slate-600 truncate bg-white">{foto.descricao}</p>
                  )}
                  <button
                    onClick={() => deletarFoto(foto)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <Image size={40} className="mb-2" />
              <p className="text-sm">Nenhuma foto cadastrada</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Prontuário */}
      <Modal open={prontOpen} onClose={() => setProntOpen(false)} title="Prontuário do Veículo" size="xl">
        {prontLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : prontData ? (
          <div className="space-y-5">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-bold text-lg text-slate-800">{prontData.veiculo.placa}</span>
              <span className="text-slate-600 capitalize">{prontData.veiculo.marca} {prontData.veiculo.modelo} {prontData.veiculo.ano || ''}</span>
              <span className="text-slate-400 text-sm">· {prontData.veiculo.cliente_nome}</span>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <History size={16} className="text-slate-400 mb-1" />
                <p className="text-lg font-bold text-slate-800">{prontData.total_ordens}</p>
                <p className="text-xs text-slate-500">Visitas</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <Wrench size={16} className="text-green-500 mb-1" />
                <p className="text-lg font-bold text-slate-800">{prontData.total_concluidas}</p>
                <p className="text-xs text-slate-500">Concluídas</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <CircleDollarSign size={16} className="text-blue-500 mb-1" />
                <p className="text-lg font-bold text-slate-800">{fmtMoeda(prontData.total_gasto)}</p>
                <p className="text-xs text-slate-500">Total gasto</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <CalendarClock size={16} className="text-amber-500 mb-1" />
                <p className="text-lg font-bold text-slate-800">{prontData.ultima_visita ? new Date(prontData.ultima_visita).toLocaleDateString('pt-BR') : '—'}</p>
                <p className="text-xs text-slate-500">Última visita</p>
              </div>
            </div>

            {/* Linha do tempo */}
            {prontData.timeline.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <History size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma ordem de serviço registrada para este veículo ainda.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Histórico de serviços</h3>
                <div className="border-l-2 border-slate-100 ml-1.5 pl-5 space-y-4">
                  {prontData.timeline.map(os => (
                    <div key={os.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 text-sm">{os.numero}</span>
                            {statusBadge(os.status)}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{fmtMoeda(os.total_geral)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-400">
                          <span>{new Date(os.data_entrada).toLocaleDateString('pt-BR')}</span>
                          {os.quilometragem_entrada > 0 && <span>· {os.quilometragem_entrada.toLocaleString('pt-BR')} km</span>}
                          {os.mecanico_nome && <span>· {os.mecanico_nome}</span>}
                        </div>
                        {os.problema_relatado && <p className="text-xs text-slate-500 mt-1.5">{os.problema_relatado}</p>}
                        {(os.servicos.length > 0 || os.pecas.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {os.servicos.map((s, i) => (
                              <span key={'s' + i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                <Wrench size={10} /> {s.descricao}
                              </span>
                            ))}
                            {os.pecas.map((p, i) => (
                              <span key={'p' + i} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                <Package size={10} /> {p.descricao}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Preview foto */}
      {fotoPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setFotoPreview(null)}>
          <img src={fotoPreview} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setFotoPreview(null)}>
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
