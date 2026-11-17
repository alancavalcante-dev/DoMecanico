import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { ChecklistAvulso, ChecklistPublico } from '../acompanhar/tipos'
import { fmtData, fmtDiaHora, haQuanto, linkWhatsApp, rolar, rotuloOS } from '../acompanhar/util'
import { SecaoChecklist } from '../acompanhar/Secoes'
import { EstadoPagina, HeroCarro, LadoOficina, PaginaOficina } from '../acompanhar/Moldura'

// Checklist de entrada que a oficina manda por link: o cliente confere como o
// carro chegou (km, combustível, marcas) e assina com o dedo.

/** A API do checklist avulso usa nomes de campo do cadastro; a seção usa os da página da OS. */
function paraSecao(c: ChecklistAvulso): ChecklistPublico {
  return {
    token_publico: c.token_publico,
    status: c.status,
    quilometragem: c.quilometragem,
    nivel_combustivel: c.nivel_combustivel_display,
    observacoes_gerais: c.observacoes_gerais,
    assinatura: c.assinatura,
    data_assinatura: c.data_assinatura,
    criado_em: c.criado_em,
    danos: c.danos.map(d => ({
      regiao: d.regiao_display,
      tipo: d.tipo_display + (d.descricao ? `: ${d.descricao}` : ''),
      foto_url: d.foto_url,
    })),
  }
}

function CartaoSituacao({ c }: { c: ChecklistAvulso }) {
  const assinado = c.status === 'assinado'
  const n = c.danos.length
  return (
    <div className={`trk-status ${assinado ? 'concluida' : ''}`} aria-live="polite">
      <div className="live">
        <b>{!assinado && <span className="pulse" aria-hidden="true" />} Checklist</b>
        <span>feito {haQuanto(c.criado_em)}</span>
      </div>
      <h2>{assinado ? 'Tudo confirmado' : 'Falta a sua assinatura'}</h2>
      <p className="frase">
        {assinado
          ? `Você confirmou como o carro chegou${c.data_assinatura ? ` em ${fmtDiaHora(c.data_assinatura)}` : ''}. O registro fica guardado aqui.`
          : 'A oficina anotou como o carro chegou. Confira e assine no fim da página.'}
      </p>

      <div className="trk-facts">
        <div><span className="trk-label">Km</span><b>{c.quilometragem.toLocaleString('pt-BR')}</b></div>
        <div><span className="trk-label">Tanque</span><b>{c.nivel_combustivel_display || '—'}</b></div>
        <div className={n ? 'warn' : ''}><span className="trk-label">Marcas</span><b>{n || 'nenhuma'}</b></div>
      </div>

      {!assinado && (
        <button type="button" className="trk-btn of trk-cta" onClick={() => rolar('checklist')}>
          Conferir e assinar <ArrowRight size={17} />
        </button>
      )}
      {c.os && (
        <Link className={`trk-btn ${assinado ? 'of' : 'line'} trk-cta`} to={`/acompanhar/${c.os.token_publico}`}>
          Acompanhar a {rotuloOS(c.os.numero)} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  )
}

export default function ChecklistCliente() {
  const { token } = useParams<{ token: string }>()
  const [c, setC] = useState<ChecklistAvulso | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    if (!token) return
    axios.get(`/api/checklist-publico/${token}/`)
      .then(r => { setC(r.data); setEstado('ok') })
      .catch(() => setEstado('erro'))
  }, [token])

  if (estado !== 'ok' || !c) {
    return (
      <EstadoPagina carregando={estado === 'carregando'} titulo="Não achamos esse checklist"
        texto="O link pode estar incompleto. Peça um novo link para a oficina." />
    )
  }

  const wa = linkWhatsApp(c.oficina_telefone, `o checklist de entrada do carro placa ${c.veiculo_placa}`)

  return (
    <PaginaOficina of={c} wa={wa}>
      <HeroCarro v={c} cliente={c.cliente_nome}
        eyebrow={`Entrada na oficina · ${fmtData(c.criado_em)}`}
        lado={<CartaoSituacao c={c} />} />

      <div className="trk-wrap">
        <div className="trk-body sem-ask">
          <div className="trk-main">
            <SecaoChecklist checklist={paraSecao(c)}
              onAssinado={n => setC(p => (p ? { ...p, status: 'assinado', assinatura: n.assinatura, data_assinatura: n.data_assinatura } : p))} />
          </div>

          <LadoOficina of={c} wa={wa}>
            <div className="trk-why">
              <ShieldCheck size={20} />
              <div>
                <b>Por que assinar?</b>
                A assinatura registra como o carro entrou na oficina. Isso protege você e a oficina se surgir alguma dúvida depois.
              </div>
            </div>
          </LadoOficina>
        </div>
      </div>
    </PaginaOficina>
  )
}
