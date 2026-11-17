import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, BellRing, CheckCircle, ClipboardList, FileText, Wrench } from 'lucide-react'
import type { OrcamentoAvulso } from '../acompanhar/tipos'
import { diasAte, fmtData, fmtMoeda, haQuanto, linkWhatsApp, rolar, rotuloOS } from '../acompanhar/util'
import { SecaoOrcamento } from '../acompanhar/Secoes'
import { EstadoPagina, HeroCarro, LadoOficina, PaginaOficina } from '../acompanhar/Moldura'

// Página do orçamento que a oficina manda por link. O cliente vê os itens,
// aprova ou recusa ali mesmo e, aprovado, segue para o acompanhamento da OS.

const SITUACAO: Record<string, { cls: string; titulo: string }> = {
  pendente:  { cls: '',          titulo: 'Esperando sua resposta' },
  aprovado:  { cls: 'concluida', titulo: 'Orçamento aprovado' },
  rejeitado: { cls: 'cancelada', titulo: 'Orçamento recusado' },
  expirado:  { cls: 'cancelada', titulo: 'Orçamento vencido' },
}

function CartaoTotal({ orc }: { orc: OrcamentoAvulso }) {
  const sit = SITUACAO[orc.status] ?? SITUACAO.pendente
  const pendente = orc.status === 'pendente'
  const faltam = orc.validade ? diasAte(orc.validade) : null
  const n = orc.itens.length

  const frase = pendente
    ? 'Confira os itens e responda por aqui. A oficina só começa depois da sua aprovação.'
    : orc.status === 'aprovado'
      ? 'A oficina já foi avisada e vai cuidar do seu carro.'
      : orc.status === 'rejeitado'
        ? 'Nada será feito. Se mudar de ideia, fale com a oficina.'
        : 'O prazo deste orçamento passou. Peça um novo para a oficina.'

  return (
    <div className={`trk-status ${sit.cls}`} aria-live="polite">
      <div className="live">
        <b>{pendente && <span className="pulse" aria-hidden="true" />} Orçamento</b>
        <span>enviado {haQuanto(orc.criado_em)}</span>
      </div>
      <h2>{sit.titulo}</h2>
      <p className="frase">{frase}</p>

      <div className="trk-total">
        <span className="trk-label">Total · {n} {n === 1 ? 'item' : 'itens'}</span>
        <b>{fmtMoeda(orc.total_geral)}</b>
        {Number(orc.desconto) > 0 && <span className="off">com {fmtMoeda(orc.desconto)} de desconto</span>}
      </div>

      {pendente && orc.validade && faltam !== null && (
        <p className={`trk-valid ${faltam <= 2 ? 'quase' : ''}`}>
          Válido até {fmtData(orc.validade)}
          {faltam > 1 ? ` · faltam ${faltam} dias` : faltam === 1 ? ' · falta 1 dia' : faltam === 0 ? ' · vence hoje' : ''}
        </p>
      )}

      {pendente && (
        <button type="button" className="trk-btn of trk-cta" onClick={() => rolar('orcamento')}>
          Ver itens e responder <ArrowRight size={17} />
        </button>
      )}
      {orc.status === 'aprovado' && orc.os && (
        <Link className="trk-btn of trk-cta" to={`/acompanhar/${orc.os.token_publico}`}>
          Acompanhar a {rotuloOS(orc.os.numero)} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  )
}

const PASSOS = [
  { icon: FileText, t: 'Você confere e aprova', d: 'Aqui mesmo, sem precisar ligar.' },
  { icon: BellRing, t: 'A oficina é avisada', d: 'E abre a ordem de serviço do seu carro.' },
  { icon: Wrench, t: 'Você acompanha o serviço', d: 'Desta página você segue para o andamento, do começo ao fim.' },
]

export default function OrcamentoPublico() {
  const { token } = useParams<{ token: string }>()
  const [orc, setOrc] = useState<OrcamentoAvulso | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    if (!token) return
    axios.get(`/api/orcamento-publico/${token}/`)
      .then(r => { setOrc(r.data); setEstado('ok') })
      .catch(() => setEstado('erro'))
  }, [token])

  if (estado !== 'ok' || !orc) {
    return (
      <EstadoPagina carregando={estado === 'carregando'} titulo="Não achamos esse orçamento"
        texto="O link pode estar incompleto ou o orçamento foi apagado. Peça um novo link para a oficina." />
    )
  }

  const wa = linkWhatsApp(orc.oficina_telefone, `o orçamento ${orc.numero} (placa ${orc.veiculo_placa})`)

  return (
    <PaginaOficina of={orc} wa={wa}>
      <HeroCarro v={orc} cliente={orc.cliente_nome} eyebrow={`Orçamento ${orc.numero} · ${fmtData(orc.criado_em)}`}
        lado={<CartaoTotal orc={orc} />} />

      <div className="trk-wrap">
        <div className="trk-body sem-ask">
          <div className="trk-main">
            {orc.problema_relatado && (
              <div className="trk-card">
                <header><h2><ClipboardList size={21} /> O pedido</h2></header>
                <div className="trk-quote">
                  <div className="trk-label">O que você contou</div>
                  <p>{orc.problema_relatado}</p>
                </div>
              </div>
            )}

            <SecaoOrcamento orc={orc} os={orc.os}
              onRespondido={(status, os) => setOrc(p => (p ? { ...p, status, os: os ?? p.os } : p))} />

            {orc.status === 'pendente' && (
              <div className="trk-card">
                <header><h2><CheckCircle size={21} /> Depois que você aprovar</h2></header>
                <ol className="trk-flow">
                  {PASSOS.map((p, i) => (
                    <li key={p.t}>
                      <span className="n">{i + 1}</span>
                      <p.icon size={20} />
                      <b>{p.t}</b>
                      <span>{p.d}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <LadoOficina of={orc} wa={wa} />
        </div>
      </div>
    </PaginaOficina>
  )
}
