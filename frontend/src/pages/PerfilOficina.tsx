import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  AlertCircle, ArrowRight, BatteryCharging, CalendarCheck, CheckCircle, CircleDot, ClipboardCheck, Clock, Cog, Disc,
  Droplet, FileText, Fuel, MapPin, MoveVertical, Navigation, Paintbrush, Phone, Radio, ScanLine, Search, Settings2,
  ShieldCheck, Snowflake, Wind, Wrench, Zap, type LucideIcon,
} from 'lucide-react'
import { WA } from '../site/ui'
import type { OficinaPublica } from '../acompanhar/tipos'
import { cidadeUF, fmtData, linkMapa, linkTelefone, linkWhatsApp, rolar, ROTULO_STATUS } from '../acompanhar/util'
import { EstadoPagina, MarcaOficina, PaginaOficina } from '../acompanhar/Moldura'
import '../acompanhar/perfil.css'

// Página pública da oficina (/oficina/:slug): quem é, o que faz, onde fica,
// agendar um horário e acompanhar o carro que já está lá.

interface Perfil {
  nome: string
  slug_publico: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  horario_funcionamento: string
  descricao_publica: string
  servicos_oferecidos: string[]
  logo: string | null
  cor_primaria: string
  garantia_dias: number | null
}

interface OSResumo {
  id: number
  numero: string
  status: string
  veiculo_placa: string
  veiculo_modelo: string
  descricao_problema: string
  data_entrada: string
  token_publico: string
}

/** A moldura comum (barra, cartão, rodapé) fala a língua da página da OS. */
const comoOficina = (p: Perfil): OficinaPublica => ({
  oficina_nome: p.nome, oficina_telefone: p.telefone, oficina_endereco: p.endereco, oficina_cidade: p.cidade,
  oficina_estado: p.estado, oficina_cep: p.cep, oficina_horario: p.horario_funcionamento,
  oficina_cor_primaria: p.cor_primaria, oficina_logo_url: p.logo, oficina_perfil: null,
})

// ── Ícone de cada serviço, pelo nome que a oficina escreveu ──────────────────

const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ICONES: [RegExp, LucideIcon][] = [
  [/freio|pastilha|disco/, Disc],
  [/suspens|amortec|bieleta|bandeja/, MoveVertical],
  [/oleo|lubrif|filtro/, Droplet],
  [/bateria|alternador|partida/, BatteryCharging],
  [/eletric|eletron/, Zap],
  [/injec|combust|bico/, Fuel],
  [/ar.?cond|climatiz/, Snowflake],
  [/alinha|balance|pneu|roda/, CircleDot],
  [/embreag|cambio|transmiss/, Cog],
  [/motor|retifica|correia/, Settings2],
  [/revis|preventiv|check/, ClipboardCheck],
  [/escap|catalis/, Wind],
  [/funilaria|pintura|lanternag/, Paintbrush],
  [/diagn|scanner|injecao eletronica/, ScanLine],
]
const iconeDo = (servico: string) => ICONES.find(([re]) => re.test(sem(servico)))?.[1] ?? Wrench

// ── Datas e horários para o pedido de agendamento ────────────────────────────

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const HORAS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const isoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Próximos 12 dias úteis (sem domingo). */
function proximosDias() {
  const out: { iso: string; topo: string; dia: string }[] = []
  const d = new Date(); d.setHours(0, 0, 0, 0)
  for (let i = 0; out.length < 12 && i < 20; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i)
    if (x.getDay() === 0) continue
    out.push({
      iso: isoDia(x),
      topo: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIAS[x.getDay()],
      dia: `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return out
}

/** "09:00" → "9h" */
const hTexto = (h: string) => `${Number(h.slice(0, 2))}h`
const horaPassou = (iso: string, h: string) => iso === isoDia(new Date()) && Number(h.slice(0, 2)) <= new Date().getHours()
const rotuloDia = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const x = new Date(y, m - 1, d)
  return `${DIAS[x.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
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

const erroDe = (e: unknown, padrao: string) =>
  (e as { response?: { data?: { erro?: string } } })?.response?.data?.erro || padrao

// ── SEO: título, meta e JSON-LD AutoRepair a partir dos dados da oficina ─────

const SEO_BASE = 'https://domecanico.net'

function setMeta(attr: 'name' | 'property', nome: string, valor: string) {
  let el = document.head.querySelector(`meta[${attr}="${nome}"]`) as HTMLMetaElement | null
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nome); document.head.appendChild(el) }
  el.setAttribute('content', valor)
}

function useSeoOficina(perfil: Perfil | null, naoAchou: boolean) {
  useEffect(() => {
    if (!naoAchou) return
    document.title = 'Oficina não encontrada — DoMecânico'
    setMeta('name', 'robots', 'noindex, follow')
    document.head.querySelector('link[rel="canonical"]')?.remove()
  }, [naoAchou])

  useEffect(() => {
    if (!perfil) return
    const url = `${SEO_BASE}/oficina/${perfil.slug_publico}`
    const local = [perfil.cidade, perfil.estado].filter(Boolean).join('/')
    const titulo = `${perfil.nome}${local ? ` — Oficina em ${local}` : ' — Oficina Mecânica'} | DoMecânico`
    const desc = (perfil.descricao_publica
      || `${perfil.nome}: ${perfil.servicos_oferecidos.slice(0, 6).join(', ') || 'serviços automotivos'}${local ? ` em ${local}` : ''}. Agende e acompanhe sua ordem de serviço online.`
    ).replace(/\s+/g, ' ').trim().slice(0, 300)
    const logoAbs = perfil.logo ? (perfil.logo.startsWith('http') ? perfil.logo : SEO_BASE + perfil.logo) : null

    document.title = titulo
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', 'index, follow')
    setMeta('property', 'og:title', titulo)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    if (logoAbs) setMeta('property', 'og:image', logoAbs)
    let can = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!can) { can = document.createElement('link'); can.setAttribute('rel', 'canonical'); document.head.appendChild(can) }
    can.setAttribute('href', url)

    const ld: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'AutoRepair', name: perfil.nome, url }
    if (logoAbs) ld.image = logoAbs
    if (perfil.telefone) ld.telephone = perfil.telefone
    if (perfil.endereco || perfil.cidade || perfil.estado) {
      ld.address = {
        '@type': 'PostalAddress',
        ...(perfil.endereco ? { streetAddress: perfil.endereco } : {}),
        ...(perfil.cidade ? { addressLocality: perfil.cidade } : {}),
        ...(perfil.estado ? { addressRegion: perfil.estado } : {}),
        ...(perfil.cep ? { postalCode: perfil.cep } : {}),
        addressCountry: 'BR',
      }
    }
    if (perfil.servicos_oferecidos.length) ld.knowsAbout = perfil.servicos_oferecidos
    let s = document.getElementById('ld-oficina') as HTMLScriptElement | null
    if (!s) { s = document.createElement('script'); s.id = 'ld-oficina'; s.type = 'application/ld+json'; document.head.appendChild(s) }
    s.textContent = JSON.stringify(ld)
    return () => { document.getElementById('ld-oficina')?.remove() }
  }, [perfil])
}

// ── Acompanhar o carro que já está na oficina ────────────────────────────────

function BuscaOS({ slug }: { slug: string }) {
  const [placa, setPlaca] = useState('')
  const [doc, setDoc] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [lista, setLista] = useState<OSResumo[] | null>(null)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setBuscando(true); setErro(''); setLista(null)
    try {
      const r = await axios.get(`/api/os-publica/oficina/${slug}/`, {
        params: { placa: placa.replace(/[^a-zA-Z0-9]/g, ''), cpf: doc.replace(/\D/g, '') },
      })
      const dados: OSResumo[] = Array.isArray(r.data) ? r.data : []
      setLista(dados)
      if (!dados.length) setErro('Não achamos nenhum serviço com essa placa e esse CPF/CNPJ aqui na oficina.')
    } catch (err) {
      setErro(erroDe(err, 'Não deu para buscar agora. Confira a internet e tente de novo.'))
    } finally { setBuscando(false) }
  }

  return (
    <div className="pf-track" id="acompanhar">
      <div className="hd">
        <span className="ic"><Radio size={20} /></span>
        <div>
          <h3>Seu carro já está aqui?</h3>
          <p>Veja o andamento, o orçamento e a garantia.</p>
        </div>
      </div>
      <form onSubmit={buscar}>
        <label htmlFor="pf-placa">Placa</label>
        <div className="trk-plate sm">
          <div className="band" aria-hidden="true"><span>BRASIL</span><i>BR</i></div>
          <input id="pf-placa" value={placa} maxLength={8} placeholder="ABC1D23" autoComplete="off" required
            onChange={e => setPlaca(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} />
        </div>
        <label htmlFor="pf-doc" style={{ marginTop: 14 }}>CPF ou CNPJ <span className="hint">de quem deixou o carro</span></label>
        <input id="pf-doc" className="pf-input" value={doc} inputMode="numeric" placeholder="000.000.000-00" required
          onChange={e => setDoc(mascaraDoc(e.target.value))} />
        <button type="submit" className="trk-btn of block" disabled={buscando || placa.length < 7 || doc.replace(/\D/g, '').length < 11}
          style={{ marginTop: 14 }}>
          <Search size={16} /> {buscando ? 'Buscando…' : 'Ver meu carro'}
        </button>
      </form>
      {erro && <p className="trk-err" role="alert"><AlertCircle size={17} /> {erro}</p>}
      {lista && lista.length > 0 && (
        <ul className="pf-os">
          {lista.map(o => (
            <li key={o.id}>
              <Link to={`/acompanhar/${o.token_publico}`}>
                <span className="top">
                  <b>{o.veiculo_modelo}</b>
                  <span className={`trk-pill ${o.status}`}>{ROTULO_STATUS[o.status] ?? o.status}</span>
                </span>
                <span className="sub">{o.numero} · entrou em {fmtData(o.data_entrada)}</span>
                <span className="go">Abrir acompanhamento <ArrowRight size={15} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Pedido de agendamento ────────────────────────────────────────────────────

interface Pedido { servico: string; dia: string; hora: string }

function Agendar({ perfil, servico, setServico }: { perfil: Perfil; servico: string; setServico: (s: string) => void }) {
  const [dias] = useState(proximosDias)
  const [dia, setDia] = useState('')
  const [hora, setHora] = useState('')
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [placa, setPlaca] = useState('')
  const [veiculo, setVeiculo] = useState('')
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<Pedido | null>(null)
  const opcoes = [...perfil.servicos_oferecidos, 'Outro / não sei dizer']

  const escolherDia = (iso: string) => { setDia(iso); if (hora && horaPassou(iso, hora)) setHora('') }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servico || !dia || !hora) { setErro('Escolha o serviço, o dia e o horário.'); return }
    setEnviando(true); setErro('')
    try {
      await axios.post(`/api/auth/perfil/${perfil.slug_publico}/agendar/`, {
        nome_cliente: nome.trim(), telefone: tel.trim(), email_cliente: email.trim(),
        veiculo_placa: placa, veiculo_descricao: veiculo.trim(),
        servico_desejado: servico, data_hora: `${dia}T${hora}:00`, observacoes: obs.trim(),
      })
      setFeito({ servico, dia, hora })
    } catch (err) {
      setErro(erroDe(err, 'Não deu para enviar o pedido. Confira a internet e tente de novo.'))
    } finally { setEnviando(false) }
  }

  if (feito) {
    const quando = `${rotuloDia(feito.dia)} às ${hTexto(feito.hora)}`
    const wa = linkWhatsApp(perfil.telefone, `o horário que pedi pelo site: ${feito.servico}, ${quando}`)
    return (
      <div className="pf-card pf-ok" id="agendar" role="status">
        <span className="big"><CalendarCheck size={30} /></span>
        <h2>Pedido enviado!</h2>
        <p>A {perfil.nome} recebeu seu pedido e vai confirmar o horário com você{tel ? ` pelo ${tel}` : ''}.</p>
        <div className="resumo">
          <div><span className="trk-label">Serviço</span><b>{feito.servico}</b></div>
          <div><span className="trk-label">Quando</span><b>{quando}</b></div>
        </div>
        <div className="acts">
          {wa && <a className="trk-btn zap" href={wa} target="_blank" rel="noopener noreferrer"><WA size={17} /> Avisar no WhatsApp</a>}
          <button type="button" className="trk-btn line" onClick={() => { setFeito(null); setDia(''); setHora(''); setObs('') }}>Fazer outro pedido</button>
        </div>
      </div>
    )
  }

  return (
    <form className="pf-card pf-book" id="agendar" onSubmit={enviar}>
      <header>
        <span className="trk-label">Agendar</span>
        <h2>Peça um horário</h2>
        <p>Escolha o que precisa e quando prefere. A oficina confirma com você antes.</p>
      </header>

      <fieldset>
        <legend><span className="n">1</span> O que o carro precisa</legend>
        <div className="pf-chips">
          {opcoes.map(s => (
            <button key={s} type="button" className={servico === s ? 'on' : ''} aria-pressed={servico === s} onClick={() => setServico(s)}>{s}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><span className="n">2</span> Dia</legend>
        <div className="pf-days">
          {dias.map(d => (
            <button key={d.iso} type="button" className={dia === d.iso ? 'on' : ''} aria-pressed={dia === d.iso} onClick={() => escolherDia(d.iso)}>
              <small>{d.topo}</small><b>{d.dia}</b>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><span className="n">3</span> Horário {perfil.horario_funcionamento && <span className="hint">· a oficina abre {perfil.horario_funcionamento}</span>}</legend>
        <div className="pf-hours">
          {HORAS.map(h => {
            const off = !dia || horaPassou(dia, h)
            return (
              <button key={h} type="button" disabled={off} className={hora === h ? 'on' : ''} aria-pressed={hora === h} onClick={() => setHora(h)}>{h}</button>
            )
          })}
        </div>
        {!dia && <p className="pf-tip">Escolha o dia primeiro.</p>}
      </fieldset>

      <fieldset>
        <legend><span className="n">4</span> Seus dados</legend>
        <div className="pf-grid">
          <label><span>Nome</span><input className="pf-input" required value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" placeholder="Seu nome" /></label>
          <label><span>WhatsApp ou telefone</span><input className="pf-input" required value={tel} onChange={e => setTel(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" /></label>
          <label><span>Placa</span>
            <div className="trk-plate sm">
              <div className="band" aria-hidden="true"><span>BRASIL</span><i>BR</i></div>
              <input required value={placa} maxLength={8} placeholder="ABC1D23" autoComplete="off"
                onChange={e => setPlaca(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} />
            </div>
          </label>
          <label><span>Carro <span className="hint">opcional</span></span><input className="pf-input" value={veiculo} onChange={e => setVeiculo(e.target.value)} placeholder="Ex.: Gol 2018 branco" /></label>
          <label className="full"><span>E-mail <span className="hint">opcional</span></span><input className="pf-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="voce@email.com" /></label>
          <label className="full"><span>O que está acontecendo? <span className="hint">opcional</span></span>
            <textarea className="pf-input" rows={3} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex.: barulho quando passa em lombada, luz da injeção acesa…" />
          </label>
        </div>
      </fieldset>

      {erro && <p className="trk-err" role="alert"><AlertCircle size={17} /> {erro}</p>}
      <button type="submit" className="trk-btn of block pf-send" disabled={enviando}>
        {enviando ? 'Enviando…' : <>Pedir horário{dia && hora ? ` · ${rotuloDia(dia)} às ${hTexto(hora)}` : ''} <ArrowRight size={17} /></>}
      </button>
      <p className="pf-tip center">Não é cobrado nada pelo pedido.</p>
    </form>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function PerfilOficina() {
  const { slug } = useParams<{ slug: string }>()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [servico, setServico] = useState('')
  useSeoOficina(perfil, estado === 'erro')

  useEffect(() => {
    if (!slug) return
    axios.get(`/api/auth/perfil/${slug}/`)
      .then(r => { setPerfil(r.data); setEstado('ok') })
      .catch(() => setEstado('erro'))
  }, [slug])

  if (estado !== 'ok' || !perfil) {
    return (
      <EstadoPagina carregando={estado === 'carregando'} titulo="Oficina não encontrada"
        texto="O link pode estar errado ou a oficina desligou a página pública." />
    )
  }

  const of = comoOficina(perfil)
  const wa = linkWhatsApp(perfil.telefone, 'um serviço no meu carro')
  const tel = linkTelefone(perfil.telefone)
  const mapa = linkMapa(of)
  const local = cidadeUF(of)
  const servicos = perfil.servicos_oferecidos
  const agendar = (s?: string) => { if (s) setServico(s); rolar('agendar') }

  const selos = [
    perfil.garantia_dias && { icon: ShieldCheck, t: `${perfil.garantia_dias} dias de garantia`, d: 'nos serviços feitos aqui' },
    { icon: FileText, t: 'Orçamento no celular', d: 'você vê cada item e aprova' },
    { icon: Radio, t: 'Acompanhe o serviço', d: 'do recebimento à entrega' },
  ].filter(Boolean) as { icon: LucideIcon; t: string; d: string }[]

  const passos = [
    { t: 'Peça um horário', d: 'Por aqui ou no WhatsApp. A oficina confirma com você.' },
    { t: 'Receba o orçamento', d: 'Cada peça e serviço com o preço, no seu celular. Nada é feito sem você aprovar.' },
    { t: 'Acompanhe o carro', d: 'Um link mostra quando o carro entra, o andamento e quando fica pronto.' },
    { t: 'Garantia guardada', d: perfil.garantia_dias ? `${perfil.garantia_dias} dias de garantia, com o prazo contando no mesmo link.` : 'O que foi feito e a garantia ficam no mesmo link.' },
  ]

  return (
    <PaginaOficina of={of} wa={wa} convite dock={<>
      <button type="button" className="trk-btn of" onClick={() => agendar()}><CalendarCheck size={16} /> Agendar</button>
      {wa ? <a className="trk-btn zap" href={wa} target="_blank" rel="noopener noreferrer"><WA size={17} /> WhatsApp</a>
        : tel && <a className="trk-btn line" href={tel}><Phone size={16} /> Ligar</a>}
      {mapa && <a className="trk-btn line" href={mapa} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> Ir até lá</a>}
    </>}>
      {/* Herói */}
      <div className="pf-hero">
        <div className="trk-wrap">
          <div className="txt">
            <div className="who">
              <MarcaOficina of={of} grande />
              <span className="eyebrow"><span>Oficina mecânica</span>{local && <span className="loc">{local}</span>}</span>
            </div>
            <h1>{perfil.nome}</h1>
            {perfil.descricao_publica && <p className="lead">{perfil.descricao_publica}</p>}
            <div className="cta">
              <button type="button" className="trk-btn of lg" onClick={() => agendar()}><CalendarCheck size={18} /> Agendar horário</button>
              {wa && <a className="trk-btn zap lg" href={wa} target="_blank" rel="noopener noreferrer"><WA size={18} /> Chamar no WhatsApp</a>}
              {!wa && tel && <a className="trk-btn ghost-ink lg" href={tel}><Phone size={17} /> Ligar</a>}
            </div>
            <ul className="seals">
              {selos.map(s => <li key={s.t}><s.icon size={18} /><span><b>{s.t}</b>{s.d}</span></li>)}
            </ul>
            <button type="button" className="pf-jump" onClick={() => rolar('acompanhar')}>
              Seu carro já está aqui? <b>Acompanhe o serviço</b> <ArrowRight size={15} />
            </button>
          </div>

          <div className="pf-visit">
            <span className="trk-label">Visite a oficina</span>
            <dl>
              {(perfil.endereco || local) && (
                <div>
                  <dt><MapPin size={18} /></dt>
                  <dd>
                    <b>{perfil.endereco || local}</b>
                    {perfil.endereco && local && <span>{local}{perfil.cep && ` · ${perfil.cep}`}</span>}
                  </dd>
                </div>
              )}
              {perfil.horario_funcionamento && (
                <div><dt><Clock size={18} /></dt><dd><b>{perfil.horario_funcionamento}</b><span>Horário de atendimento</span></dd></div>
              )}
              {perfil.telefone && (
                <div><dt><Phone size={18} /></dt><dd><b>{tel ? <a href={tel}>{perfil.telefone}</a> : perfil.telefone}</b><span>Telefone{wa && ' e WhatsApp'}</span></dd></div>
              )}
            </dl>
            {mapa && (
              <a className="pf-map" href={mapa} target="_blank" rel="noopener noreferrer" aria-label="Abrir o endereço no mapa">
                <span className="pin"><MapPin size={20} /></span>
                <span className="go">Como chegar <ArrowRight size={16} /></span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Serviços */}
      {servicos.length > 0 && (
        <div className="trk-wrap pf-sec">
          <div className="pf-head">
            <span className="trk-label">Serviços</span>
            <h2>O que a {perfil.nome} faz</h2>
            <p>Toque num serviço para pedir um horário.</p>
          </div>
          <div className="pf-services">
            {servicos.map(s => {
              const Icon = iconeDo(s)
              return (
                <button key={s} type="button" onClick={() => agendar(s)}>
                  <span className="ic"><Icon size={22} /></span>
                  <b>{s}</b>
                  <span className="go">Agendar <ArrowRight size={14} /></span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Como funciona */}
      <div className="pf-how">
        <div className="trk-wrap">
          <div className="pf-head inv">
            <span className="trk-label">Como funciona</span>
            <h2>Do pedido à garantia, tudo pelo celular</h2>
          </div>
          <ol>
            {passos.map((p, i) => (
              <li key={p.t}><span className="n">0{i + 1}</span><b>{p.t}</b><p>{p.d}</p></li>
            ))}
          </ol>
        </div>
      </div>

      {/* Agendar + acompanhar */}
      <div className="trk-wrap pf-sec pf-split">
        <Agendar perfil={perfil} servico={servico} setServico={setServico} />
        <aside className="pf-side">
          <BuscaOS slug={perfil.slug_publico} />
          <p className="trk-safe"><CheckCircle size={16} /> Seus dados vão só para a {perfil.nome}, para ela falar com você sobre o serviço.</p>
        </aside>
      </div>
    </PaginaOficina>
  )
}
