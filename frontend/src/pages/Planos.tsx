import SiteLayout from '../site/SiteLayout'
import { PageHero, SectionHead, FAQList, type Pergunta } from '../site/ui'
import { Odometro } from '../site/brand'
import { PlanCards, ComparativoPlanos, emTodoPlano } from '../site/planos'
import { usePlanos } from '../site/planosData'

const FAQ_COBRANCA: Pergunta[] = [
  { p: 'Como funciona o teste grátis?', r: 'São 14 dias com tudo liberado, sem pedir cartão. No fim do teste você escolhe o plano e paga pelo painel. Se não quiser continuar, é só não assinar.' },
  { p: 'Qual a forma de pagamento?', r: 'O pagamento é feito por Pix, direto na tela de Assinatura do painel. A liberação é automática assim que o pagamento é confirmado.' },
  { p: 'Posso trocar de plano depois?', r: 'Pode. Na tela de Assinatura você escolhe outro plano; ao pagar, a troca vale na hora. Seus dados continuam todos lá.' },
  { p: 'Tem fidelidade ou multa?', r: 'Não. A assinatura é mensal e você cancela pelo painel quando quiser. Seus dados ficam disponíveis por 30 dias depois do cancelamento.' },
]

export default function Planos() {
  const { planos, status } = usePlanos()
  const comuns = status === 'ok' ? emTodoPlano(planos) : []
  return (
    <SiteLayout fechamento={{ titulo: 'Comece hoje, escolha o plano depois.', texto: '14 dias com tudo liberado, sem cartão. Você só escolhe o plano quando já souber o que usa.' }}>
      <PageHero
        eyebrow="Planos"
        title={<>Teste grátis por <span className="odo-box"><Odometro valor="14" /></span> dias. Depois, um preço que cabe na oficina.</>}
        lead="Sem cartão pra começar e sem fidelidade. Escolha o plano quando já souber o que usa."
      />

      <section className="tight-top">
        <div className="wrap plans-grid">
          <div>
            {comuns.length > 0 && (
              <div className="em-todo" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
                <b>Em todo plano</b>
                <ul>{comuns.map(c => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
          </div>
          <PlanCards planos={planos} status={status} comDescricao />
        </div>
      </section>

      {status === 'ok' && (
        <section id="comparar">
          <div className="wrap">
            <SectionHead title="Plano por plano, recurso por recurso." />
            <ComparativoPlanos planos={planos} />
          </div>
        </section>
      )}

      <section id="faq">
        <div className="wrap faq-split">
          <SectionHead title="Perguntas sobre pagamento" lead="Pix pelo painel, sem fidelidade e sem multa." />
          <FAQList items={FAQ_COBRANCA} />
        </div>
      </section>
    </SiteLayout>
  )
}
