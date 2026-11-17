import SiteLayout from '../site/SiteLayout'
import { PageHero, SectionHead, FAQList, CTABand, type Pergunta } from '../site/ui'
import { PlanCards, ComparativoPlanos } from '../site/planos'
import { usePlanos } from '../site/planosData'

const FAQ_COBRANCA: Pergunta[] = [
  { p: 'Como funciona o teste grátis?', r: 'São 14 dias com tudo liberado, sem pedir cartão. No fim do teste você escolhe o plano e paga pelo painel — se não quiser continuar, é só não assinar.' },
  { p: 'Qual a forma de pagamento?', r: 'O pagamento é feito por Pix, direto na tela de Assinatura do painel. A liberação é automática assim que o pagamento é confirmado.' },
  { p: 'Posso trocar de plano depois?', r: 'Pode. Na tela de Assinatura você escolhe outro plano; ao pagar, a troca vale na hora. Seus dados continuam todos lá.' },
  { p: 'Tem fidelidade ou multa?', r: 'Não. A assinatura é mensal e você cancela pelo painel quando quiser. Seus dados ficam disponíveis por 30 dias depois do cancelamento.' },
]

export default function Planos() {
  const { planos, status } = usePlanos()
  return (
    <SiteLayout>
      <PageHero
        center
        eyebrow="Planos"
        title="Um preço que cabe na oficina."
        lead="Comece com 14 dias grátis e tudo liberado. Sem cartão, sem fidelidade — escolha o plano quando já souber o que usa."
      />

      <section style={{ paddingTop: 16 }}>
        <div className="wrap">
          <PlanCards planos={planos} status={status} comDescricao />
        </div>
      </section>

      {status === 'ok' && (
        <section id="comparar">
          <div className="wrap">
            <SectionHead eyebrow="Comparativo" title="Plano por plano, recurso por recurso." center />
            <ComparativoPlanos planos={planos} />
          </div>
        </section>
      )}

      <section id="faq">
        <div className="wrap">
          <SectionHead eyebrow="Cobrança" title="Perguntas sobre pagamento" center />
          <FAQList items={FAQ_COBRANCA} />
        </div>
      </section>

      <CTABand title="Comece hoje, escolha o plano depois." />
    </SiteLayout>
  )
}
