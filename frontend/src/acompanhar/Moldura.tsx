import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, ChevronLeft, Clock, Gauge, Lock, MapPin, Navigation, Palette, Phone, SearchX } from 'lucide-react'
import '../site/site.css'
import './acompanhar.css'
import { Placa } from '../site/brand'
import { WA } from '../site/ui'
import type { OficinaPublica, VeiculoPublico } from './tipos'
import { cidadeUF, linkMapa, linkTelefone, varsDaOficina } from './util'

// Moldura comum das páginas que o cliente da oficina abre pelo link: OS, orçamento
// e checklist. Veste a cor da oficina; a marca DoMecânico só aparece no rodapé.


export function MarcaOficina({ of, grande }: { of: OficinaPublica; grande?: boolean }) {
  return (
    <div className={`trk-mark ${grande ? 'lg' : ''}`} aria-hidden="true">
      {of.oficina_logo_url ? <img src={of.oficina_logo_url} alt="" /> : of.oficina_nome.trim().charAt(0).toUpperCase()}
    </div>
  )
}

/** Cartão "Sua oficina": endereço, horário, contato, serviços e o perfil público. */
export function CartaoOficina({ of, wa }: { of: OficinaPublica; wa: string | null }) {
  const tel = linkTelefone(of.oficina_telefone)
  const mapa = linkMapa(of)
  const perfil = of.oficina_perfil
  const local = cidadeUF(of)

  return (
    <div className="trk-shop">
      <div className="cap" />
      <div className="in">
        <span className="trk-label">Sua oficina</span>
        <div className="hd" style={{ marginTop: 12 }}>
          <MarcaOficina of={of} grande />
          <div style={{ minWidth: 0 }}>
            <h2>{of.oficina_nome}</h2>
            {local && <span>{local}</span>}
          </div>
        </div>
        {perfil?.descricao && <p className="desc">{perfil.descricao}</p>}

        <dl>
          {(of.oficina_endereco || local) && (
            <div>
              <dt><MapPin size={18} /></dt>
              <dd>
                <small>Endereço</small>
                {[of.oficina_endereco, local].filter(Boolean).join(', ')}{of.oficina_cep && ` · ${of.oficina_cep}`}
                {mapa && <><br /><a href={mapa} target="_blank" rel="noopener noreferrer">Como chegar</a></>}
              </dd>
            </div>
          )}
          {of.oficina_horario && (
            <div><dt><Clock size={18} /></dt><dd><small>Horário</small>{of.oficina_horario}</dd></div>
          )}
          {of.oficina_telefone && (
            <div>
              <dt><Phone size={18} /></dt>
              <dd><small>Telefone</small>{tel ? <a href={tel}>{of.oficina_telefone}</a> : of.oficina_telefone}</dd>
            </div>
          )}
        </dl>

        {(wa || tel) && (
          <div className="acts">
            {wa && <a className="trk-btn zap" href={wa} target="_blank" rel="noopener noreferrer"><WA size={17} /> WhatsApp</a>}
            {tel && <a className="trk-btn line" href={tel}><Phone size={16} /> Ligar</a>}
          </div>
        )}

        {perfil && perfil.servicos.length > 0 && (
          <div className="svc" aria-label="Serviços da oficina">
            {perfil.servicos.slice(0, 8).map(s => <span key={s}>{s}</span>)}
          </div>
        )}
      </div>
      {perfil && (
        <Link className="profile" to={`/oficina/${perfil.slug}`}>Conhecer a oficina <ArrowRight size={17} /></Link>
      )}
    </div>
  )
}

/** Coluna da direita: a oficina e o aviso de que o link é pessoal. */
export function LadoOficina({ of, wa, children }: { of: OficinaPublica; wa: string | null; children?: ReactNode }) {
  return (
    <aside className="trk-aside">
      <CartaoOficina of={of} wa={wa} />
      {children}
      <p className="trk-safe"><Lock size={16} /> Este link é só seu: ele mostra o seu carro e os dados da oficina. Não repasse para outras pessoas.</p>
    </aside>
  )
}

/** Herói escuro com o carro (esquerda) e um cartão de situação (direita). */
export function HeroCarro({ v, eyebrow, cliente, km, abaixo, lado }: {
  v: VeiculoPublico; eyebrow: string; cliente: string; km?: number; abaixo?: ReactNode; lado: ReactNode
}) {
  return (
    <div className="trk-hero">
      <div className="trk-wrap">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{v.veiculo_marca} {v.veiculo_modelo}</h1>
          <div className="specs">
            {v.veiculo_ano && <span><Calendar size={14} /> {v.veiculo_ano}</span>}
            {v.veiculo_cor && <span><Palette size={14} /> {v.veiculo_cor}</span>}
            {!!km && km > 0 && <span className="mono"><Gauge size={14} /> {km.toLocaleString('pt-BR')} km</span>}
          </div>
          <div className="plate-row">
            <Placa faixa="BRASIL" size="lg">{v.veiculo_placa}</Placa>
            <span className="owner">Cliente<br /><b>{cliente}</b></span>
          </div>
          {abaixo}
        </div>
        {lado}
      </div>
    </div>
  )
}

/** Página inteira: barra da oficina, conteúdo, rodapé e a barra de ações no celular. */
export function PaginaOficina({ of, wa, onVoltar, children }: {
  of: OficinaPublica; wa: string | null; onVoltar?: () => void; children: ReactNode
}) {
  const tel = linkTelefone(of.oficina_telefone)
  const mapa = linkMapa(of)
  const local = cidadeUF(of)

  return (
    <div className="lp trk-os" style={varsDaOficina(of.oficina_cor_primaria)}>
      <header className="trk-bar">
        <div className="trk-wrap">
          {onVoltar && (
            <button type="button" className="back" onClick={onVoltar} aria-label="Voltar"><ChevronLeft size={20} /></button>
          )}
          <MarcaOficina of={of} />
          <div className="who">
            <b>{of.oficina_nome}</b>
            {local && <span><MapPin size={12} /> {local}</span>}
          </div>
          <div className="acts">
            {wa && <a className="trk-btn zap" href={wa} target="_blank" rel="noopener noreferrer"><WA size={16} /> WhatsApp</a>}
            {tel && <a className="trk-btn line" href={tel}><Phone size={15} /> Ligar</a>}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="trk-foot">
        <div className="trk-wrap">
          <span>{of.oficina_nome}</span>
          <Link className="by" to="/" aria-label="Página feita com DoMecânico">
            <span>Feito com</span>
            <img src="/logotipo.png" alt="DoMecânico" width={89} height={26} />
          </Link>
        </div>
      </footer>

      {(wa || tel || mapa) && (
        <div className="trk-dock">
          {wa && <a className="trk-btn zap" href={wa} target="_blank" rel="noopener noreferrer"><WA size={17} /> WhatsApp</a>}
          {tel && <a className="trk-btn line" href={tel}><Phone size={16} /> Ligar</a>}
          {mapa && <a className="trk-btn line" href={mapa} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> Ir até lá</a>}
        </div>
      )}
    </div>
  )
}

/** Carregando (esqueleto) ou link inválido. */
export function EstadoPagina({ carregando, titulo, texto }: { carregando: boolean; titulo: string; texto: string }) {
  return (
    <div className="lp trk-os">
      <div className="trk-state">
        {carregando ? (
          <div className="trk-skel" aria-label="Carregando" role="status">
            <i style={{ width: '40%' }} /><i style={{ height: 44, width: '75%' }} /><i /><i style={{ width: '85%' }} /><i style={{ width: '60%' }} />
          </div>
        ) : (
          <div>
            <SearchX size={44} style={{ color: 'var(--ink-faint)' }} />
            <h1>{titulo}</h1>
            <p>{texto}</p>
          </div>
        )}
      </div>
    </div>
  )
}
