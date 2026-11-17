import { useState } from 'react'
import { ArrowRight, Check, ClipboardCheck, FileText, Images, Wrench } from 'lucide-react'
import type { Foto, OSPublica } from './tipos'
import { diasAte, fmtData, fmtDiaHora, fmtDiaMes, fmtMoeda, haQuanto, infoStatus, linkWhatsApp, rolar, rotuloOS } from './util'
import { Lightbox, SecaoChecklist, SecaoGarantias, SecaoOrcamento, SecaoServicos } from './Secoes'
import { HeroCarro, LadoOficina, PaginaOficina } from './Moldura'

// Página que o cliente da oficina abre pelo link (WhatsApp) ou pela busca.

function CartaoStatus({ os }: { os: OSPublica }) {
  // Concluída há mais de uma semana: o carro provavelmente já foi retirado.
  const antiga = os.status === 'concluida' && !!os.data_conclusao && diasAte(os.data_conclusao) < -7
  const info = antiga
    ? { ...infoStatus(os.status), titulo: 'Serviço concluído', frase: `O serviço terminou em ${fmtData(os.data_conclusao)}. A garantia e o que foi feito ficam guardados aqui.` }
    : infoStatus(os.status)
  const cancelada = os.status === 'cancelada'
  const concluida = os.status === 'concluida'
  const peca = os.status === 'aguardando_peca'
  const atualizado = os.status_alterado_em || os.data_entrada

  const passos = [
    { t: 'Carro recebido', tm: fmtDiaHora(os.data_entrada) },
    {
      t: peca ? 'Esperando peça' : 'Em serviço',
      tm: info.etapa === 2 && os.status_alterado_em ? `desde ${fmtDiaHora(os.status_alterado_em)}` : '',
    },
    {
      t: 'Pronto para buscar',
      tm: os.data_conclusao ? fmtDiaHora(os.data_conclusao) : os.data_previsao ? `previsto para ${fmtDiaMes(os.data_previsao)}` : '',
    },
  ]

  return (
    <div className={`trk-status ${os.status}`} aria-live="polite">
      <div className="live">
        <b><span className="pulse" aria-hidden="true" /> {cancelada ? 'Situação' : 'Agora'}</b>
        <span>atualizado {haQuanto(atualizado)}</span>
      </div>
      <h2>{info.titulo}</h2>
      <p className="frase">{info.frase}</p>
      {!cancelada && (
        <ol className="trk-steps">
          {passos.map((p, i) => {
            const n = i + 1
            const estado = concluida || n < info.etapa ? 'done' : n === info.etapa ? `now ${peca ? 'peca' : ''}` : ''
            return (
              <li key={p.t} className={estado}>
                <span className="dot">{estado === 'done' && <Check size={14} strokeWidth={3.2} />}</span>
                <div>
                  <div className="st">{p.t}</div>
                  {p.tm && <div className="tm">{p.tm}</div>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default function DetalheOS({ os: inicial, onVoltar }: { os: OSPublica; onVoltar?: () => void }) {
  const [os, setOs] = useState(inicial)
  const [foto, setFoto] = useState<Foto | null>(null)
  const concluida = os.status === 'concluida'
  const wa = linkWhatsApp(os.oficina_telefone, `a OS ${os.numero} (placa ${os.veiculo_placa})`)

  const orcPendente = os.orcamento?.status === 'pendente'
  const assinarPendente = os.checklist?.status === 'pendente'
  const pedidos = [
    orcPendente && os.orcamento && {
      id: 'orcamento', icon: FileText, titulo: 'Tem um orçamento esperando sua resposta',
      texto: `Total de ${fmtMoeda(os.orcamento.total_geral)}. Veja os itens e aprove por aqui mesmo.`, acao: 'Ver orçamento',
    },
    assinarPendente && {
      id: 'checklist', icon: ClipboardCheck, titulo: 'Confirme como o carro chegou',
      texto: 'A oficina anotou o estado do carro na entrada e pede a sua assinatura.', acao: 'Ver e assinar',
    },
  ].filter(Boolean) as { id: string; icon: typeof FileText; titulo: string; texto: string; acao: string }[]

  const secoes = [
    { id: 'resumo', label: 'Resumo', alerta: false, mostra: true },
    { id: 'orcamento', label: 'Orçamento', alerta: orcPendente, mostra: !!os.orcamento },
    { id: 'checklist', label: 'Entrada', alerta: assinarPendente, mostra: !!os.checklist },
    { id: 'servicos', label: 'O que foi feito', alerta: false, mostra: concluida && os.servicos.length > 0 },
    { id: 'garantias', label: 'Garantia', alerta: false, mostra: concluida && os.garantias.length > 0 },
  ].filter(s => s.mostra)

  const datas = [
    { t: 'Entrada', v: os.data_entrada },
    { t: 'Previsão', v: os.data_previsao },
    { t: 'Conclusão', v: os.data_conclusao },
  ]

  return (
    <PaginaOficina of={os} wa={wa} onVoltar={onVoltar}>
        {/* Herói: o carro e o status */}
        <HeroCarro
          v={os} cliente={os.cliente_nome} km={os.quilometragem_entrada}
          eyebrow={`${rotuloOS(os.numero)} · entrou em ${fmtData(os.data_entrada)}`}
          abaixo={os.fotos_veiculo.length > 0 && (
            <div className="trk-photos" aria-label="Fotos do veículo">
              {os.fotos_veiculo.map(f => (
                <button key={f.id} type="button" onClick={() => setFoto(f)} aria-label={`Ampliar foto${f.descricao ? `: ${f.descricao}` : ''}`}>
                  <img src={f.foto_url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          lado={<CartaoStatus os={os} />}
        />

        <div className="trk-wrap">
          {pedidos.length > 0 && (
            <div className="trk-ask">
              {pedidos.map(p => (
                <div key={p.id} className="item">
                  <div className="ic"><p.icon size={21} /></div>
                  <div className="tx"><b>{p.titulo}</b><span>{p.texto}</span></div>
                  <button type="button" className="trk-btn of" onClick={() => rolar(p.id)}>{p.acao} <ArrowRight size={16} /></button>
                </div>
              ))}
            </div>
          )}

          <div className={`trk-body ${pedidos.length ? '' : 'sem-ask'}`}>
            <div className="trk-main">
              {secoes.length > 2 && (
                <nav className="trk-nav" aria-label="Seções desta OS">
                  {secoes.map(s => (
                    <button key={s.id} type="button" onClick={() => rolar(s.id)}>
                      {s.label}{s.alerta && <span className="alert" aria-label="precisa da sua ação" />}
                    </button>
                  ))}
                </nav>
              )}

              {/* Resumo */}
              <div className="trk-card" id="resumo">
                <header>
                  <h2><Wrench size={21} /> O serviço</h2>
                  <span className={`trk-pill ${os.status}`}>{os.status_display}</span>
                </header>
                {os.problema_relatado && (
                  <div className="trk-quote">
                    <div className="trk-label">O que você contou</div>
                    <p>{os.problema_relatado}</p>
                  </div>
                )}
                {concluida && os.diagnostico && (
                  <div className="trk-diag">
                    <div className="trk-label">O que a oficina encontrou</div>
                    <p>{os.diagnostico}</p>
                  </div>
                )}
                {concluida && os.observacoes && (
                  <div className="trk-obs">
                    <div className="trk-label">Recado da oficina</div>
                    <p>{os.observacoes}</p>
                  </div>
                )}
                {os.mecanico_nome && (
                  <div className="trk-mec">
                    <div className="av" aria-hidden="true">{os.mecanico_nome.trim().charAt(0).toUpperCase()}</div>
                    <div><b>{os.mecanico_nome}</b>Mecânico responsável pelo seu carro</div>
                  </div>
                )}
                <div className="trk-dates">
                  {datas.map(d => (
                    <div key={d.t} className={d.v ? '' : 'vazio'}>
                      <span className="trk-label">{d.t}</span>
                      <b>{d.v ? fmtData(d.v) : 'a definir'}</b>
                    </div>
                  ))}
                </div>
              </div>

              {os.orcamento && (
                <SecaoOrcamento orc={os.orcamento}
                  onRespondido={s => setOs(p => (p.orcamento ? { ...p, orcamento: { ...p.orcamento, status: s } } : p))} />
              )}
              {os.checklist && (
                <SecaoChecklist checklist={os.checklist} onAssinado={c => setOs(p => ({ ...p, checklist: c }))} />
              )}
              {concluida && os.servicos.length > 0 && <SecaoServicos servicos={os.servicos} />}
              {concluida && os.garantias.length > 0 && <SecaoGarantias garantias={os.garantias} />}

              {os.fotos_veiculo.length > 3 && (
                <div className="trk-card">
                  <header><h2><Images size={21} /> Fotos do carro</h2><span className="meta">{os.fotos_veiculo.length} fotos</span></header>
                  <div className="trk-dmg-photos">
                    {os.fotos_veiculo.map(f => (
                      <button key={f.id} type="button" onClick={() => setFoto(f)} aria-label="Ampliar foto">
                        <img src={f.foto_url} alt="" loading="lazy" />
                        {f.descricao && <span>{f.descricao}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <LadoOficina of={os} wa={wa} />
          </div>
        </div>

      {foto && <Lightbox src={foto.foto_url} legenda={foto.descricao} onFechar={() => setFoto(null)} />}
    </PaginaOficina>
  )
}
