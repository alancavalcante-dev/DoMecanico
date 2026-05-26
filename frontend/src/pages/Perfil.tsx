import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { Upload, Building2, Palette, Save, ImageIcon } from 'lucide-react'

interface OficinaForm {
  nome: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  cor_primaria: string
}

export default function Perfil() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<OficinaForm>({
    nome: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    cor_primaria: '#2563eb',
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [salvandoLogo, setSalvandoLogo] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (user?.oficina) {
      const o = user.oficina as any
      setForm({
        nome: o.nome || '',
        telefone: o.telefone || '',
        endereco: o.endereco || '',
        cidade: o.cidade || '',
        estado: o.estado || '',
        cep: o.cep || '',
        cor_primaria: o.cor_primaria || '#2563eb',
      })
      if (o.logo_url) {
        setLogoPreview(o.logo_url)
      }
    }
  }, [user])

  const handleFileSelect = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Formato inválido. Use JPEG, PNG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Limite: 2 MB.')
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const salvarDados = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoDados(true)
    try {
      await authAPI.atualizarOficina(form)
      await refreshUser()
      toast.success('Dados da oficina atualizados!')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar dados.')
    } finally {
      setSalvandoDados(false)
    }
  }

  const salvarLogo = async () => {
    if (!logoFile) {
      toast.error('Selecione uma imagem primeiro.')
      return
    }
    setSalvandoLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', logoFile)
      const res = await authAPI.uploadLogo(fd)
      setLogoPreview(res.data.logo_url)
      setLogoFile(null)
      await refreshUser()
      toast.success('Logo atualizada com sucesso!')
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao enviar logo.')
    } finally {
      setSalvandoLogo(false)
    }
  }

  const corPreview = form.cor_primaria || '#2563eb'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Building2 size={28} className="text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Perfil da Oficina</h1>
          <p className="text-sm text-slate-500">Gerencie os dados, logo e identidade visual da sua oficina</p>
        </div>
      </div>

      {/* Logo da Oficina */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-500" />
          Logo da Oficina
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-48 h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-xl p-2" />
            ) : (
              <>
                <Upload size={32} className="text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 text-center px-2">Clique ou arraste a logo aqui</p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP · máx 2 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-600">
              A logo aparecerá no cabeçalho de todos os PDFs gerados (Ordens de Serviço, Notas Fiscais e Checklists).
            </p>
            <p className="text-xs text-slate-400">
              Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 2 MB.
            </p>
            {logoFile && (
              <p className="text-xs text-green-600 font-medium">
                Arquivo selecionado: {logoFile.name}
              </p>
            )}
            <button
              onClick={salvarLogo}
              disabled={!logoFile || salvandoLogo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload size={15} />
              {salvandoLogo ? 'Enviando...' : 'Salvar Logo'}
            </button>
          </div>
        </div>
      </div>

      {/* Cor Primária */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Palette size={18} className="text-blue-500" />
          Cor Primária dos PDFs
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-600">
              Selecione a cor principal da sua oficina:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.cor_primaria}
                onChange={(e) => setForm(p => ({ ...p, cor_primaria: e.target.value }))}
                className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={form.cor_primaria}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                    setForm(p => ({ ...p, cor_primaria: v }))
                  }
                }}
                maxLength={7}
                placeholder="#2563eb"
                className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mini preview do cabeçalho do PDF */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
              Preview do cabeçalho do PDF
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-9 h-9 object-contain rounded" />
                  ) : (
                    <Building2 size={18} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{form.nome || 'Nome da Oficina'}</p>
                  <p className="text-[10px] text-slate-500">
                    {form.cidade && form.estado ? `${form.cidade} / ${form.estado}` : 'Cidade / Estado'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: corPreview }}>ORDEM DE SERVIÇO</p>
                  <p className="text-[10px] text-slate-500">Nº OS000001</p>
                </div>
              </div>
              <div className="h-0.5" style={{ backgroundColor: corPreview }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Esta cor será aplicada nos cabeçalhos de tabelas e títulos dos documentos PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Dados da Oficina */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-blue-500" />
          Dados da Oficina
        </h2>
        <form onSubmit={salvarDados} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome da oficina *</label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => setForm(p => ({ ...p, cep: e.target.value }))}
                onBlur={async (e) => {
                  const cep = e.target.value.replace(/\D/g, '')
                  if (cep.length !== 8) return
                  try {
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    const data = await res.json()
                    if (!data.erro) {
                      setForm(p => ({
                        ...p,
                        endereco: data.logradouro ? `${data.logradouro}, ${data.bairro}` : p.endereco,
                        cidade: data.localidade || p.cidade,
                        estado: data.uf || p.estado,
                      }))
                    }
                  } catch {}
                }}
                placeholder="00000-000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))}
                placeholder="Rua, número, bairro"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado (UF)</label>
              <input
                type="text"
                value={form.estado}
                onChange={(e) => setForm(p => ({ ...p, estado: e.target.value.toUpperCase().slice(0, 2) }))}
                maxLength={2}
                placeholder="SP"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={salvandoDados}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={15} />
              {salvandoDados ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
