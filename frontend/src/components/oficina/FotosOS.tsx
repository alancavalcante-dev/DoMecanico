import { useRef, useState } from 'react'
import { Camera, ImagePlus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordensAPI } from '../../api'
import type { FotoOS } from '../../types'

interface Props {
  ordemId: number
  fotos: FotoOS[]
  onChange: (fotos: FotoOS[]) => void
  grande?: boolean
}

/** Fotos do serviço (antes/depois, peça trocada). Câmera traseira direto no celular. */
export default function FotosOS({ ordemId, fotos, onChange, grande = false }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(0)
  const [ampliada, setAmpliada] = useState<FotoOS | null>(null)

  const enviar = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const lista = Array.from(files)
    setEnviando(lista.length)
    let atuais = fotos
    for (const f of lista) {
      try {
        const r = await ordensAPI.enviarFoto(ordemId, f)
        atuais = [...atuais, r.data]
        onChange(atuais)
      } catch (err: any) {
        toast.error(err.response?.data?.erro || 'Erro ao enviar foto.')
      } finally {
        setEnviando(n => n - 1)
      }
    }
    if (cameraRef.current) cameraRef.current.value = ''
    if (galeriaRef.current) galeriaRef.current.value = ''
  }

  const remover = async (foto: FotoOS) => {
    if (!window.confirm('Apagar esta foto?')) return
    try {
      await ordensAPI.deletarFoto(ordemId, foto.id)
      onChange(fotos.filter(f => f.id !== foto.id))
      setAmpliada(null)
    } catch {
      toast.error('Erro ao apagar foto.')
    }
  }

  const btn = grande ? 'min-h-14 text-base' : 'min-h-10 text-sm'

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={enviando > 0}
          className={`flex items-center justify-center gap-2 rounded-lg bg-slate-800 text-white font-semibold disabled:opacity-60 ${btn}`}>
          <Camera size={grande ? 22 : 16} /> {enviando > 0 ? `Enviando ${enviando}…` : 'Tirar foto'}
        </button>
        <button type="button" onClick={() => galeriaRef.current?.click()} disabled={enviando > 0}
          className={`flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold disabled:opacity-60 ${btn}`}>
          <ImagePlus size={grande ? 22 : 16} /> Da galeria
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => enviar(e.target.files)} />
      <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => enviar(e.target.files)} />

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {fotos.map(f => (
            <button key={f.id} type="button" onClick={() => setAmpliada(f)}
              className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
              aria-label={`Ver foto enviada por ${f.enviado_por || 'equipe'}`}>
              <img src={f.foto} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {ampliada && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col" onClick={() => setAmpliada(null)}>
          <div className="flex items-center justify-between p-3 text-white text-sm" onClick={e => e.stopPropagation()}>
            <span className="truncate">
              {ampliada.enviado_por || 'Equipe'} · {new Date(ampliada.criado_em).toLocaleString('pt-BR')}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => remover(ampliada)} aria-label="Apagar foto"
                className="p-3 rounded-lg bg-red-600/80 hover:bg-red-600"><Trash2 size={18} /></button>
              <button type="button" onClick={() => setAmpliada(null)} aria-label="Fechar"
                className="p-3 rounded-lg bg-white/10 hover:bg-white/20"><X size={18} /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-3 min-h-0">
            <img src={ampliada.foto} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
