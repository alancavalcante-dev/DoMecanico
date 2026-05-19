import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { checklistAPI } from '../api'
import { CheckCircle, AlertTriangle, Car, Fuel, Gauge } from 'lucide-react'

interface Dano {
  id: number
  tipo_display: string
  regiao_display: string
  descricao: string
  foto_url: string | null
}

interface ChecklistPublico {
  id: number
  token_publico: string
  status: string
  cliente_nome: string
  veiculo_info: string
  quilometragem: number
  nivel_combustivel: string
  nivel_combustivel_display: string
  observacoes_gerais: string
  danos: Dano[]
  oficina_nome: string
  criado_em: string
  assinatura: string
  data_assinatura: string | null
}

const COMBUSTIVEL_PCT: Record<string, number> = {
  'vazio': 0, '1/4': 25, '1/2': 50, '3/4': 75, 'cheio': 100,
}

function PadAssinatura({ onSalvar }: { onSalvar: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhandoRef = useRef(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const iniciar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    desenhandoRef.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!desenhandoRef.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e40af'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const parar = () => { desenhandoRef.current = false }

  const limpar = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
        onMouseDown={iniciar}
        onMouseMove={desenhar}
        onMouseUp={parar}
        onMouseLeave={parar}
        onTouchStart={iniciar}
        onTouchMove={desenhar}
        onTouchEnd={parar}
      />
      <div className="flex gap-3 mt-3">
        <button onClick={limpar} type="button"
          className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
          Limpar
        </button>
        <button type="button"
          onClick={() => onSalvar(canvasRef.current!.toDataURL('image/png'))}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm">
          Confirmar e Assinar
        </button>
      </div>
    </div>
  )
}

export default function ChecklistCliente() {
  const { token } = useParams<{ token: string }>()
  const [checklist, setChecklist] = useState<ChecklistPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [assinando, setAssinando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    if (!token) return
    checklistAPI.publico(token)
      .then(r => setChecklist(r.data))
      .catch(() => setErro('Checklist não encontrado ou link inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAssinar = async (dataUrl: string) => {
    if (!token) return
    setAssinando(true)
    try {
      await checklistAPI.assinarPublico(token, dataUrl)
      setConcluido(true)
    } catch {
      setErro('Erro ao registrar assinatura. Tente novamente.')
    } finally {
      setAssinando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{erro}</p>
        </div>
      </div>
    )
  }

  if (concluido || checklist?.status === 'assinado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Checklist assinado!</h1>
          <p className="text-gray-500 text-sm">
            Obrigado, {checklist?.cliente_nome}. O checklist de entrada do seu veículo foi registrado com sucesso.
          </p>
          {checklist?.data_assinatura && (
            <p className="text-gray-400 text-xs mt-3">
              Assinado em: {new Date(checklist.data_assinatura).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!checklist) return null

  const pct = COMBUSTIVEL_PCT[checklist.nivel_combustivel] ?? 50

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <p className="text-blue-200 text-sm">{checklist.oficina_nome}</p>
          <h1 className="text-xl font-bold mt-0.5">Checklist de Entrada</h1>
          <p className="text-blue-200 text-sm mt-1">
            {new Date(checklist.criado_em).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Dados do veículo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" /> Seu veículo
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Cliente</p>
              <p className="font-medium text-gray-800">{checklist.cliente_nome}</p>
            </div>
            <div>
              <p className="text-gray-400">Veículo</p>
              <p className="font-medium text-gray-800">{checklist.veiculo_info}</p>
            </div>
          </div>
        </div>

        {/* KM e Combustível */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Gauge className="w-4 h-4" /> Quilometragem
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {checklist.quilometragem.toLocaleString('pt-BR')}
            </p>
            <p className="text-gray-400 text-xs">km</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Fuel className="w-4 h-4" /> Combustível
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${pct}%` }} />
            </div>
            <p className="text-gray-700 font-semibold text-sm mt-1">{checklist.nivel_combustivel_display}</p>
          </div>
        </div>

        {/* Observações */}
        {checklist.observacoes_gerais && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Observações registradas:</p>
            <p>{checklist.observacoes_gerais}</p>
          </div>
        )}

        {/* Danos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Avarias identificadas ({checklist.danos.length})
          </h2>
          {checklist.danos.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma avaria registrada.</p>
          ) : (
            <div className="space-y-2">
              {checklist.danos.map((d, i) => (
                <div key={d.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{d.regiao_display} — {d.tipo_display}</p>
                    {d.descricao && <p className="text-gray-500 mt-0.5">{d.descricao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assinatura */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1">Assinatura Digital</h2>
          <p className="text-gray-500 text-sm mb-4">
            Ao assinar, você confirma que as informações acima estão corretas e que os danos listados
            são pré-existentes à entrada do veículo na oficina.
          </p>
          {assinando ? (
            <div className="text-center py-4 text-gray-400">Salvando...</div>
          ) : (
            <PadAssinatura onSalvar={handleAssinar} />
          )}
        </div>
      </div>
    </div>
  )
}
