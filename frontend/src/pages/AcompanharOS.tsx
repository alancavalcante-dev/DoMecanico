import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  AlertTriangle, ArrowRight, ChevronLeft, ClipboardCheck, FileText, Radio, Search, SearchX, ShieldCheck,
} from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { Placa } from '../site/brand'
import { WA } from '../site/ui'
import { AcompanharMock } from '../site/mocks'
import DetalheOS from '../acompanhar/DetalheOS'
import type { OSPublica } from '../acompanhar/tipos'
import { ROTULO_STATUS, corDaOficina, fmtData, rotuloOS } from '../acompanhar/util'

// /acompanhar: o cliente procura o carro pela placa + CPF/CNPJ (dentro do site).
// /acompanhar/:token: o link que a oficina manda (abre direto a página da OS).

// ── Página via token ──────────────────────────────────────────────────────────

export function AcompanharOSToken() {
  const { token } = useParams<{ token: string }>()
  const [os, setOs] = useState<OSPublica | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    if (!token) return
    axios.get(`/api/os-publica/${token}/`)
      .then(r => { setOs(r.data); setEstado('ok') })
      .catch(() => setEstado('erro'))
  }, [token])

  if (estado === 'ok' && os) return <DetalheOS os={os} />

  return (
    <div className="lp trk-os">
      <div className="trk-state">
        {estado === 'carregando' ? (
          <div className="trk-skel" aria-label="Carregando a OS" role="status">
            <i style={{ width: '40%' }} /><i style={{ height: 44, width: '75%' }} /><i /><i style={{ width: '85%' }} /><i style={{ width: '60%' }} />
          </div>
        ) : (
          <div>
            <SearchX size={44} style={{ color: 'var(--ink-faint)' }} />
            <h1>Não achamos essa OS</h1>
            <p>O link pode estar incompleto. Peça um novo para a oficina ou procure pela placa.</p>
            <Link className="btn btn-primary" to="/acompanhar" style={{ marginTop: 24 }}><Search size={17} /> Procurar pela placa</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Busca ─────────────────────────────────────────────────────────────────────

interface VeiculoGrupo {
  key: string
  placa: string
  marca: string
  modelo: string
  ano: string | null
  cor: string | null
  oficina_nome: string
  oficina_cor: string
  foto: string | null
  ordens: OSPublica[]
}

// Agrupa as OS por veículo (oficina + placa). O backend já manda da mais nova para a mais antiga.
function agruparVeiculos(lista: OSPublica[]): VeiculoGrupo[] {
  const mapa = new Map<string, VeiculoGrupo>()
  for (const os of lista) {
    const key = `${os.oficina_nome}|${os.veiculo_placa}`
    let g = mapa.get(key)
    if (!g) {
      g = {
        key, placa: os.veiculo_placa, marca: os.veiculo_marca, modelo: os.veiculo_modelo,
        ano: os.veiculo_ano, cor: os.veiculo_cor, oficina_nome: os.oficina_nome,
        oficina_cor: corDaOficina(os.oficina_cor_primaria), foto: null, ordens: [],
      }
      mapa.set(key, g)
    }
    g.ordens.push(os)
    if (!g.foto && os.fotos_veiculo[0]) g.foto = os.fotos_veiculo[0].foto_url
  }
  return Array.from(mapa.values())
}

/** 000.000.000-00 ou 00.000.000/0000-00 enquanto digita. */
function mascaraDoc(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

const O_QUE_VE = [
  { icon: Radio,          t: 'Andamento ao vivo', d: 'Recebido, em serviço ou pronto: muda na hora em que a oficina atualiza.' },
  { icon: FileText,       t: 'Orçamento na mão',  d: 'Veja cada peça e serviço com o preço e aprove sem precisar ligar.' },
  { icon: ClipboardCheck, t: 'Checklist da entrada', d: 'Como o carro chegou, com fotos das marcas. Você confere e assina.' },
  { icon: ShieldCheck,    t: 'Garantia guardada', d: 'O prazo de cada serviço fica aqui, contando os dias que faltam.' },
]

const topo = () => window.scrollTo({ top: 0 })

export default function AcompanharOS() {
  const [placa, setPlaca] = useState('')
  const [doc, setDoc] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultados, setResultados] = useState<OSPublica[] | null>(null)
  const [veiculoSel, setVeiculoSel] = useState<string | null>(null)
  const [selecionada, setSelecionada] = useState<OSPublica | null>(null)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true); setErro(''); setResultados(null); setVeiculoSel(null); setSelecionada(null)
    try {
      const r = await axios.post('/api/os-publica/buscar/', {
        placa: placa.replace(/[^a-zA-Z0-9]/g, ''),
        cpf_cnpj: doc.replace(/\D/g, ''),
      })
      const dados: OSPublica[] = r.data
      const grupos = agruparVeiculos(dados)
      setResultados(dados)
      // Um veículo só: pula a escolha. Se também for uma OS só, abre direto.
      if (grupos.length === 1) {
        if (grupos[0].ordens.length === 1) setSelecionada(grupos[0].ordens[0])
        else setVeiculoSel(grupos[0].key)
      }
      topo()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      setErro(msg || 'Não achamos nenhuma OS com esses dados. Confira a placa e o CPF/CNPJ.')
    } finally { setCarregando(false) }
  }

  // Página da OS escolhida (fora do site: é a página da oficina)
  if (selecionada) {
    const grupos = resultados ? agruparVeiculos(resultados) : []
    const umaSo = grupos.length === 1 && grupos[0].ordens.length === 1
    return <DetalheOS os={selecionada} onVoltar={() => { setSelecionada(null); if (umaSo) setResultados(null); topo() }} />
  }

  const grupos = resultados ? agruparVeiculos(resultados) : []
  const grupo = veiculoSel ? grupos.find(g => g.key === veiculoSel) : undefined

  // As OS de um veículo
  if (grupo) {
    return (
      <SiteLayout fechamento={false}>
        <div className="wrap trk-res">
          <button type="button" className="trk-back" onClick={() => { if (grupos.length > 1) setVeiculoSel(null); else setResultados(null); topo() }}>
            <ChevronLeft size={18} /> {grupos.length > 1 ? 'Meus veículos' : 'Nova busca'}
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ textTransform: 'capitalize' }}>{grupo.marca} {grupo.modelo}</h1>
              <p className="sec-lead">{grupo.ordens.length} {grupo.ordens.length > 1 ? 'ordens de serviço' : 'ordem de serviço'} na {grupo.oficina_nome}. Toque em uma para ver os detalhes.</p>
            </div>
            <Placa faixa="BRASIL" size="lg">{grupo.placa}</Placa>
          </div>
          <div className="trk-grid">
            {grupo.ordens.map(os => (
              <button key={os.id} type="button" className="trk-vcard" onClick={() => { setSelecionada(os); topo() }}>
                <div className="top">
                  <span className="num">{rotuloOS(os.numero)}</span>
                  <span className={`trk-pill ${os.status}`}>{ROTULO_STATUS[os.status] ?? os.status_display}</span>
                </div>
                <div>
                  <h2 style={{ textTransform: 'none' }}>Entrou em {fmtData(os.data_entrada)}</h2>
                  {os.problema_relatado && <p className="trk-q" style={{ marginTop: 8 }}>“{os.problema_relatado}”</p>}
                </div>
                <div className="foot">
                  <span>{os.data_conclusao ? `Pronto em ${fmtData(os.data_conclusao)}` : os.data_previsao ? `Previsão ${fmtData(os.data_previsao)}` : 'Sem previsão ainda'}</span>
                  <span className="go">Ver <ArrowRight size={15} /></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </SiteLayout>
    )
  }

  // Mais de um veículo para o mesmo CPF/CNPJ
  if (resultados && grupos.length > 0) {
    return (
      <SiteLayout fechamento={false}>
        <div className="wrap trk-res">
          <button type="button" className="trk-back" onClick={() => { setResultados(null); topo() }}><ChevronLeft size={18} /> Nova busca</button>
          <h1>Seus veículos</h1>
          <p className="sec-lead">Achamos {grupos.length} veículos no seu CPF/CNPJ. Escolha qual você quer acompanhar.</p>
          <div className="trk-grid">
            {grupos.map(g => {
              const ultima = g.ordens[0]
              return (
                <button key={g.key} type="button" className="trk-vcard" onClick={() => { setVeiculoSel(g.key); topo() }}>
                  <div className="top">
                    <div style={{ minWidth: 0 }}>
                      <h2>{g.marca} {g.modelo}</h2>
                      <p className="sub">{[g.ano, g.cor].filter(Boolean).join(' · ') || `${g.ordens.length} OS`}</p>
                    </div>
                    <Placa faixa="BR" size="sm">{g.placa}</Placa>
                  </div>
                  {g.foto && <div className="ph"><img src={g.foto} alt="" loading="lazy" /></div>}
                  <p className="count">
                    <b>{g.ordens.length} {g.ordens.length > 1 ? 'ordens de serviço' : 'ordem de serviço'}</b> · última em {fmtData(ultima.data_entrada)}
                  </p>
                  <div className="foot">
                    <span className="trk-of"><i className="dot" style={{ background: g.oficina_cor }} /><span>{g.oficina_nome}</span></span>
                    <span className={`trk-pill ${ultima.status}`}>{ROTULO_STATUS[ultima.status] ?? ultima.status_display}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </SiteLayout>
    )
  }

  // Formulário
  return (
    <SiteLayout fechamento={false}>
      <div className="wrap">
        <div className="trk-find">
          <div>
            <span className="eyebrow">Acompanhar carro</span>
            <h1>Como está o seu carro na oficina?</h1>
            <p className="sec-lead">Digite a placa e o CPF ou CNPJ que você deu na oficina. Você vê o andamento, aprova o orçamento e confere como o carro chegou.</p>

            <form className="trk-form" onSubmit={buscar}>
              <label htmlFor="trk-placa">Placa do carro</label>
              <div className="trk-plate">
                <div className="band" aria-hidden="true"><span>BRASIL</span><i>BR</i></div>
                <input id="trk-placa" value={placa} required maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                  placeholder="ABC1D23" onChange={e => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} />
              </div>
              <div className="trk-field">
                <label htmlFor="trk-doc">CPF ou CNPJ <span className="hint">do dono do carro</span></label>
                <input id="trk-doc" value={doc} required inputMode="numeric" autoComplete="off" placeholder="000.000.000-00"
                  onChange={e => setDoc(mascaraDoc(e.target.value))} />
              </div>
              {erro && <div className="trk-err" role="alert"><AlertTriangle size={17} /> {erro}</div>}
              <button type="submit" className="btn btn-primary btn-lg" disabled={carregando}>
                <Search size={18} /> {carregando ? 'Procurando…' : 'Acompanhar meu carro'}
              </button>
            </form>
            <p className="trk-note"><WA size={17} /> Recebeu o link da oficina pelo WhatsApp? É só tocar nele: abre direto, sem preencher nada.</p>
          </div>

          <div className="trk-stage" aria-hidden="true">
            <AcompanharMock />
            <div className="tag t1"><span className="ic"><FileText size={16} /></span><div>Orçamento para aprovar<small>R$ 890,00 · toque para ver</small></div></div>
            <div className="tag t2"><span className="ic"><ClipboardCheck size={16} /></span><div>Checklist da entrada<small>com fotos e assinatura</small></div></div>
            <div className="tag t3"><span className="ic"><ShieldCheck size={16} /></span><div>Garantia de 90 dias<small>faltam 74 dias</small></div></div>
          </div>
        </div>

        <ul className="trk-what">
          {O_QUE_VE.map(i => (
            <li key={i.t}><h3><i.icon size={19} /> {i.t}</h3><p>{i.d}</p></li>
          ))}
        </ul>
      </div>
    </SiteLayout>
  )
}
