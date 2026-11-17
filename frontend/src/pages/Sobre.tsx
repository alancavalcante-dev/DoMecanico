import { Wrench, Smartphone, Handshake, Lock, Server, ShieldCheck } from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { PageHero, SectionHead, MoreLink, CTABand } from '../site/ui'

// Página "Sobre". Os blocos .todo marcam o que só o Alan pode escrever
// (história pessoal, foto, cidade) — nada aqui é inventado.
// Eles (e o espaço da foto) só aparecem em desenvolvimento: em produção a
// história sai só com o texto pronto, até o conteúdo real existir.
const RASCUNHO = import.meta.env.DEV

const PRINCIPIOS = [
  { icon: Wrench,     t: 'Linguagem de oficina',  d: 'Placa, queixa, peça, "tá pronto?". O sistema fala como a oficina fala — sem termo de escritório.' },
  { icon: Smartphone, t: 'Feito para o celular',  d: 'Do balcão ao elevador: tudo funciona no celular, com botões grandes e o mínimo de digitação.' },
  { icon: Handshake,  t: 'Sem prender ninguém',   d: 'Teste grátis sem cartão, assinatura mensal e cancelamento pelo painel. Fica quem gosta.' },
]

const DADOS = [
  { icon: Lock,        t: 'Cada oficina isolada',  d: 'Os dados de uma oficina não aparecem para outra — o isolamento é feito no próprio banco de dados.' },
  { icon: Server,      t: 'Backups',               d: 'Cópias de segurança dos dados para você não perder o histórico da oficina.' },
  { icon: ShieldCheck, t: 'LGPD',                  d: 'Tratamos os dados conforme a Lei Geral de Proteção de Dados.' },
]

export default function Sobre() {
  return (
    <SiteLayout>
      <PageHero
        title="Feito por quem já viveu a oficina por dentro."
        lead="O DoMecânico nasceu de dentro de uma oficina — do caderno que some, do cliente ligando três vezes e da OS que ninguém acha."
      />

      <section className="tight-top">
        <div className={`wrap story ${RASCUNHO ? '' : 'solo'}`}>
          {RASCUNHO && (
            <div className="portrait">
              Espaço para a sua foto<br />(de preferência na oficina)
            </div>
          )}
          <div className="prose">
            <p>
              <b>"Fiz o DoMecânico do lado de dentro da oficina,</b> vendo OS sumir no caderno e cliente ligando três vezes
              pra saber do carro. Cada tela aqui resolve uma dor que eu vi de perto — não é um sistema genérico com cara de oficina."
            </p>
            {RASCUNHO && <>
              <p className="todo">
                Como você começou na mecânica: onde, em que ano, com o que trabalhava (mecânica geral, injeção, suspensão…).
              </p>
              <p className="todo">
                O momento em que caiu a ficha de que a oficina precisava de um sistema — uma história real do dia a dia
                (a OS que sumiu, o cliente que brigou por um risco, o fim do mês sem saber quanto entrou).
              </p>
              <p className="todo">
                Por que decidiu programar você mesmo em vez de usar um sistema pronto, e o que mudou na oficina depois.
              </p>
            </>}
            <p>
              Hoje o DoMecânico cuida de ordens de serviço, orçamentos, estoque, checklist, comissões, garantias e do
              pátio inteiro — e continua sendo construído ouvindo quem usa. Toda sugestão que chega pelo suporte é lida.
            </p>
            <p className="signed">— Alan Pereira Cavalcante</p>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <SectionHead title="Três regras que guiam cada tela." />
          <div className="cols">
            {PRINCIPIOS.map(p => (
              <div key={p.t} className="col"><h3><p.icon size={19} /> {p.t}</h3><p>{p.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <SectionHead title="A oficina é sua. Os dados também." lead="Cliente, carro, valores: informação sensível. Tratamos isso a sério." />
          <div className="cols">
            {DADOS.map(p => (
              <div key={p.t} className="col"><h3><p.icon size={19} /> {p.t}</h3><p>{p.d}</p></div>
            ))}
          </div>
          <MoreLink to="/privacidade">Ler a política de privacidade</MoreLink>
        </div>
      </section>

      <CTABand title="Conheça na prática." text="Crie a conta da sua oficina e use tudo por 14 dias, sem cartão. Qualquer dúvida, fale com a gente pelo contato." />
    </SiteLayout>
  )
}
