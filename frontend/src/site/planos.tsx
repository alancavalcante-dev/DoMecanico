import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import type { Plano, StatusPlanos } from './planosData'
import { Placa } from './brand'
import { ACAO } from './ui'

// Cards e comparativo de planos (Home e /planos). Dados em planosData.ts.

// Lista vazia = plano sem restrição de módulo (mesma regra do backend em
// accounts/views.py, que só intersecta quando modulos_disponiveis tem itens).
const tem = (p: Plano, m: string) => {
  const mods = p.modulos_disponiveis || []
  return mods.length === 0 || mods.includes(m)
}
// Para o que tem flag própria no Admin (relatórios, comprovante), a flag manda:
// só soma o módulo se ele foi listado de propósito, não pela regra da lista vazia.
const listado = (p: Plano, m: string) => (p.modulos_disponiveis || []).includes(m)

// Recursos que podem ou não estar no plano (conforme a config do Admin).
const RECURSOS: { label: string; on: (p: Plano) => boolean }[] = [
  { label: 'Ordens de serviço e orçamentos', on: p => tem(p, 'ordens') },
  { label: 'Checklist de entrada', on: p => tem(p, 'checklist') },
  { label: 'Link de acompanhamento', on: p => tem(p, 'ordens') },
  { label: 'WhatsApp automático', on: p => tem(p, 'whatsapp') },
  { label: 'Diagnósticos', on: p => tem(p, 'diagnosticos') },
  { label: 'Agendamentos', on: p => tem(p, 'agendamentos') },
  { label: 'Estoque e comissões', on: p => tem(p, 'estoque') },
  { label: 'Fotos do veículo', on: p => p.tem_fotos_veiculo },
  { label: 'Comprovante de serviço', on: p => p.tem_nota_fiscal || listado(p, 'notas_fiscais') },
  { label: 'Relatórios', on: p => p.tem_relatorios || listado(p, 'relatorios') },
]

/** O que vem em todos os planos publicados (vai uma vez só, fora dos cards). */
export const emTodoPlano = (planos: Plano[]) =>
  planos.length ? RECURSOS.filter(r => planos.every(r.on)).map(r => r.label) : []

/** Só o que este plano tem e algum outro não tem. */
const extras = (p: Plano, planos: Plano[]) =>
  RECURSOS.filter(r => r.on(p) && !planos.every(r.on)).map(r => r.label)

export const precoMinimo = (planos: Plano[]) => {
  const v = planos.map(p => parseFloat(p.preco)).filter(isFinite)
  return v.length ? String(Math.floor(Math.min(...v))) : ''
}

const fmtPreco = (preco: string) => {
  const v = parseFloat(preco)
  if (!isFinite(v)) return { inteiro: '0', centavos: '' }
  const inteiro = Math.floor(v)
  const cent = Math.round((v - inteiro) * 100)
  return { inteiro: String(inteiro), centavos: cent > 0 ? String(cent).padStart(2, '0') : '' }
}

const limite = (n: number | undefined, unidade = '') =>
  n === undefined || n === null ? '–' : n === -1 ? 'Ilimitado' : `${n.toLocaleString('pt-BR')} ${unidade}`.trim()

function PlanosErro() {
  return (
    <div className="plans-msg">
      <b style={{ fontFamily: 'var(--disp)', fontSize: 18 }}>Não deu pra carregar os preços agora.</b>
      <p>Você pode começar o teste mesmo assim: são 14 dias com tudo liberado e você escolhe o plano depois.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="btn btn-primary" to="/cadastro">{ACAO}</Link>
        <Link className="btn btn-ghost" to="/contato">Falar com a gente</Link>
      </div>
    </div>
  )
}

export function PlanCards({ planos, status, comDescricao }: { planos: Plano[]; status: StatusPlanos; comDescricao?: boolean }) {
  if (status === 'erro') return <div className="plans"><PlanosErro /></div>
  if (status === 'carregando') {
    return (
      <div className="plans" aria-busy="true">
        {[0, 1].map(i => (
          <div key={i} className="plan" style={{ opacity: .55, minHeight: 380 }}>
            <Placa faixa="Plano" size="sm">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Placa>
            <div className="price"><span className="c">R$</span><span className="v">–</span><span className="per">/mês</span></div>
            <p className="desc">Carregando…</p>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="plans">
      {planos.map(plano => {
        const { inteiro, centavos } = fmtPreco(plano.preco)
        const mais = extras(plano, planos)
        return (
          <div key={plano.id} className={`plan ${plano.destaque ? 'feat' : ''}`}>
            {plano.destaque && <span className="badge">Recomendado</span>}
            <Placa faixa="Plano">{plano.nome.toUpperCase()}</Placa>
            <div className="price">
              <span className="c">R$</span>
              <span className="v">{inteiro}</span>
              {centavos && <span className="cents">,{centavos}</span>}
              <span className="per">/mês</span>
            </div>
            {comDescricao && plano.descricao && <p className="desc">{plano.descricao}</p>}
            <ul className="lim">
              <li>Usuários <b>{limite(plano.max_usuarios)}</b></li>
              <li>OS por mês <b>{limite(plano.max_os_mes)}</b></li>
              <li>Clientes <b>{limite(plano.max_clientes)}</b></li>
              <li>Peças no estoque <b>{limite(plano.max_pecas)}</b></li>
            </ul>
            {mais.length > 0
              ? <p className="add"><b>Inclui também:</b> {mais.join(' · ')}</p>
              : <p className="add">Tudo o que vem em todo plano.</p>}
            <div className="gap" />
            <Link to="/cadastro" className={`btn ${plano.destaque ? 'btn-primary' : 'btn-tonal'}`}>{ACAO}</Link>
          </div>
        )
      })}
    </div>
  )
}

// Tabela completa: limites + cada módulo (espelha accounts.models.MODULOS).
type Linha = { sep: string } | { label: string; val: (p: Plano) => ReactNode }

const SIM = <Check size={18} strokeWidth={2.6} className="yes" aria-label="Incluso" />
const NAO = <Minus size={18} className="no" aria-label="Não incluso" />
const bool = (b: boolean) => (b ? SIM : NAO)

const LINHAS: Linha[] = [
  { sep: 'Limites' },
  { label: 'Usuários', val: p => <span className="mono">{limite(p.max_usuarios)}</span> },
  { label: 'Clientes cadastrados', val: p => <span className="mono">{limite(p.max_clientes)}</span> },
  { label: 'Ordens de serviço por mês', val: p => <span className="mono">{limite(p.max_os_mes)}</span> },
  { label: 'Peças no estoque', val: p => <span className="mono">{limite(p.max_pecas)}</span> },
  { sep: 'Atendimento' },
  { label: 'Ordens de serviço', val: p => bool(tem(p, 'ordens')) },
  { label: 'Orçamentos com aprovação pelo celular', val: p => bool(tem(p, 'orcamentos') || tem(p, 'ordens')) },
  { label: 'Checklist de entrada com assinatura', val: p => bool(tem(p, 'checklist')) },
  { label: 'Fotos do veículo', val: p => bool(p.tem_fotos_veiculo) },
  { label: 'Link de acompanhamento para o cliente', val: p => bool(tem(p, 'ordens')) },
  { label: 'WhatsApp automático', val: p => bool(tem(p, 'whatsapp')) },
  { sep: 'Pátio' },
  { label: 'Diagnósticos', val: p => bool(tem(p, 'diagnosticos')) },
  { label: 'Agendamentos', val: p => bool(tem(p, 'agendamentos')) },
  { label: 'Funcionários e equipe', val: p => bool(tem(p, 'funcionarios') || tem(p, 'equipe')) },
  { sep: 'Gestão' },
  { label: 'Estoque de peças', val: p => bool(tem(p, 'estoque')) },
  { label: 'Comissões de mecânico', val: p => bool(tem(p, 'comissoes')) },
  { label: 'Garantias de serviço', val: p => bool(tem(p, 'garantias')) },
  { label: 'Comprovantes de serviço', val: p => bool(p.tem_nota_fiscal || listado(p, 'notas_fiscais')) },
  { label: 'Relatórios e exportação', val: p => bool(p.tem_relatorios || listado(p, 'relatorios')) },
]

export function ComparativoPlanos({ planos }: { planos: Plano[] }) {
  if (!planos.length) return null
  return (
    <div className="cmp-wrap" style={{ maxWidth: 360 + planos.length * 180 }}>
      <table className="cmp" style={{ minWidth: 150 + planos.length * 90 }}>
        <thead>
          <tr>
            <th scope="col">Recurso</th>
            {planos.map(p => <th key={p.id} scope="col" className={p.destaque ? 'feat' : ''}>{p.nome}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Preço por mês</td>
            {planos.map(p => {
              const { inteiro, centavos } = fmtPreco(p.preco)
              return <td key={p.id} className={p.destaque ? 'feat' : ''}><b className="mono">R$ {inteiro}{centavos && `,${centavos}`}</b></td>
            })}
          </tr>
          {LINHAS.map(l => 'sep' in l ? (
            <tr key={l.sep} className="sep"><td colSpan={planos.length + 1}>{l.sep}</td></tr>
          ) : (
            <tr key={l.label}>
              <td>{l.label}</td>
              {planos.map(p => <td key={p.id} className={p.destaque ? 'feat' : ''}>{l.val(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
