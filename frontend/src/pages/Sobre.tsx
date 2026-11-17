import { Wrench, Smartphone, Handshake, Lock, Server, ShieldCheck } from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { PageHero, SectionHead, MoreLink } from '../site/ui'
import { Selo } from '../site/brand'

// Página "Sobre". Os blocos .todo marcam o que só o Alan pode escrever
// (história pessoal, foto, cidade): nada aqui é inventado.
// Eles (e o espaço da foto) só aparecem em desenvolvimento. Em produção a
// história sai só com o texto pronto e o selo no lugar da foto, até o conteúdo real existir.
const RASCUNHO = import.meta.env.DEV

const PRINCIPIOS = [
  { icon: Wrench,     t: 'Linguagem de oficina',  d: 'Placa, queixa, peça, “tá pronto?”. O sistema fala como a oficina fala, sem termo de escritório.' },
  { icon: Smartphone, t: 'Feito para o celular',  d: 'Do balcão ao elevador: tudo funciona no celular, com botões grandes e o mínimo de digitação.' },
  { icon: Handshake,  t: 'Sem prender ninguém',   d: 'Teste grátis sem cartão, assinatura mensal e cancelamento pelo painel. Fica quem gosta.' },
]

const DADOS = [
  { icon: Lock,        t: 'Cada oficina isolada',  d: 'Os dados de uma oficina não aparecem para outra. O isolamento é feito no próprio banco de dados.' },
  { icon: Server,      t: 'Backups',               d: 'Cópias de segurança dos dados para você não perder o histórico da oficina.' },
  { icon: ShieldCheck, t: 'LGPD',                  d: 'Tratamos os dados conforme a Lei Geral de Proteção de Dados.' },
]

export default function Sobre() {
  return (
    <SiteLayout fechamento={{ titulo: 'Conheça na prática.', texto: 'Crie a conta da sua oficina e use tudo por 14 dias, sem cartão. Qualquer dúvida, fale com a gente pelo contato.' }}>
      <PageHero
        eyebrow="Sobre"
        title="Feito por quem já viveu a oficina por dentro."
        lead="O DoMecânico nasceu dentro de uma oficina: do caderno que some, do cliente ligando três vezes e da OS que ninguém acha."
      />

      <section className="tight-top">
        <div className="wrap story">
          <div className="prose">
            <p className="lede">
              “Fiz o DoMecânico do lado de dentro da oficina, vendo OS sumir no caderno e cliente ligando três vezes
              pra saber do carro. Cada tela aqui resolve uma dor que eu vi de perto. Não é um sistema genérico com cara de oficina.”
            </p>
            {RASCUNHO && <>
              <p className="todo">
                Como você começou na mecânica: onde, em que ano, com o que trabalhava (mecânica geral, injeção, suspensão…).
              </p>
              <p className="todo">
                O momento em que caiu a ficha de que a oficina precisava de um sistema: uma história real do dia a dia
                (a OS que sumiu, o cliente que brigou por um risco, o fim do mês sem saber quanto entrou).
              </p>
              <p className="todo">
                Por que decidiu programar você mesmo em vez de usar um sistema pronto, e o que mudou na oficina depois.
              </p>
            </>}
            <p>
              Hoje o DoMecânico cuida de ordens de serviço, orçamentos, estoque, checklist, comissões, garantias e do
              pátio inteiro. E continua sendo construído ouvindo quem usa: toda sugestão que chega pelo suporte é lida.
            </p>
            <p className="signed">Alan Pereira Cavalcante</p>
          </div>
          <div className="story-side">
            {RASCUNHO && (
              <div className="portrait">
                Espaço para a sua foto<br />(de preferência na oficina)
              </div>
            )}
            {!RASCUNHO && <Selo size={280} />}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <SectionHead eyebrow="O que não muda" title="Regras de oficina e dados bem guardados." />
          <h3 className="sub-h">Três regras que guiam cada tela</h3>
          <ul className="cols">
            {PRINCIPIOS.map(p => (
              <li key={p.t} className="col"><h4><p.icon size={19} /> {p.t}</h4><p>{p.d}</p></li>
            ))}
          </ul>
          <h3 className="sub-h">A oficina é sua. Os dados também.</h3>
          <ul className="cols">
            {DADOS.map(p => (
              <li key={p.t} className="col"><h4><p.icon size={19} /> {p.t}</h4><p>{p.d}</p></li>
            ))}
          </ul>
          <MoreLink to="/privacidade">Ler a política de privacidade</MoreLink>
        </div>
      </section>
    </SiteLayout>
  )
}
