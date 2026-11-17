import type { ComponentType, ReactNode } from 'react'
import { Check, FileText, ShieldCheck, Smartphone, Wrench, Tv, Stethoscope, Calendar, Package, Percent, BadgeCheck, Receipt, BarChart3, Globe } from 'lucide-react'
import SiteLayout from '../site/SiteLayout'
import { PageHero, CTABand, WA } from '../site/ui'
import {
  OrcamentoMock, ChecklistMock, AcompanharMock, WhatsMock, FilaMecanicoMock, QuadroPatioMock,
  DiagnosticoMock, AgendaMock, EstoqueMock, ComissoesMock, GarantiaMock, RelatorioMock, MiniSiteMock,
} from '../site/mocks'

interface Recurso {
  id: string
  icon: ComponentType<{ size?: number }>
  titulo: string
  texto: string
  pontos: string[]
  mock: ReactNode
}

interface Grupo { id: string; nome: string; resumo: string; recursos: Recurso[] }

const WAIcon = ({ size }: { size?: number }) => <WA size={size} />

const GRUPOS: Grupo[] = [
  {
    id: 'atendimento', nome: 'Atendimento', resumo: 'Do carro chegando até o cliente aprovando — sem papel e sem telefone tocando.',
    recursos: [
      {
        id: 'ordens', icon: FileText, titulo: 'Ordem de serviço e orçamento',
        texto: 'Monte o orçamento com peças e serviços separados. O cliente recebe o link, aprova pelo celular e o orçamento vira OS num toque.',
        pontos: ['Peças do estoque e serviços do catálogo somam o valor sozinhos', 'Aprovação do cliente pelo link, sem login', 'PDF da OS para imprimir ou mandar'],
        mock: <OrcamentoMock />,
      },
      {
        id: 'checklist', icon: ShieldCheck, titulo: 'Checklist de entrada',
        texto: 'Registre o estado do carro na chegada, com fotos e a assinatura do cliente. Acabou a discussão sobre o risco que "não estava ali".',
        pontos: ['Fotos do veículo direto da câmera', 'Link para o cliente assinar no celular dele', 'Fica guardado junto da OS'],
        mock: <ChecklistMock />,
      },
      {
        id: 'acompanhamento', icon: Smartphone, titulo: 'Acompanhamento pelo cliente',
        texto: 'Cada OS gera um link. O cliente abre no celular e vê o status do carro, as fotos do checklist e o valor — sem baixar app nem criar conta.',
        pontos: ['Status atualiza na hora que você muda', 'Menos ligação perguntando "tá pronto?"', 'Passa uma imagem profissional da oficina'],
        mock: <AcompanharMock />,
      },
      {
        id: 'whatsapp', icon: WAIcon, titulo: 'WhatsApp automático',
        texto: 'O sistema manda a mensagem pelo seu próprio número: orçamento pronto, agendamento confirmado e carro pronto pra retirar.',
        pontos: ['Usa o número da oficina', 'Sem custo por mensagem', 'Textos das mensagens editáveis'],
        mock: <WhatsMock />,
      },
    ],
  },
  {
    id: 'patio', nome: 'Pátio', resumo: 'O dia a dia de quem está com a mão no carro — e de quem coordena o pátio.',
    recursos: [
      {
        id: 'modo-oficina', icon: Wrench, titulo: 'Modo Oficina para o mecânico',
        texto: 'O mecânico entra pelo celular e já cai na fila de trabalho dele, em cards grandes, fáceis de tocar até com a mão suja.',
        pontos: ['Atrasadas primeiro e busca por placa', 'Botões Iniciar, Aguard. peça e Pronto', 'Diagnóstico e observações com ditado por voz', 'Você decide se ele vê os valores'],
        mock: <FilaMecanicoMock />,
      },
      {
        id: 'quadro-patio', icon: Tv, titulo: 'Quadro do Pátio',
        texto: 'Todos os carros da oficina numa tela só, por status ou por mecânico, com o tempo parado em cada etapa e os atrasos em destaque.',
        pontos: ['Modo TV em tela cheia, atualiza sozinho', 'Atribui mecânico com um toque', 'Entrada rápida: placa → queixa → OS com checklist'],
        mock: <QuadroPatioMock />,
      },
      {
        id: 'diagnosticos', icon: Stethoscope, titulo: 'Diagnósticos',
        texto: 'Registre a queixa do cliente e a avaliação técnica item por item. Do diagnóstico sai o orçamento, sem digitar tudo de novo.',
        pontos: ['Queixa do cliente sempre em destaque', 'Avaliação técnica → orçamento', 'Histórico fica no prontuário do carro'],
        mock: <DiagnosticoMock />,
      },
      {
        id: 'agendamentos', icon: Calendar, titulo: 'Agendamentos',
        texto: 'A agenda da oficina num lugar só. O cliente pode marcar horário pelo mini-site da oficina e recebe a confirmação no WhatsApp.',
        pontos: ['Agenda do dia e da semana', 'Agendamento pelo site da oficina', 'Confirmação automática'],
        mock: <AgendaMock />,
      },
    ],
  },
  {
    id: 'gestao', nome: 'Gestão', resumo: 'Os números da oficina sem planilha: peça, comissão, garantia e faturamento.',
    recursos: [
      {
        id: 'estoque', icon: Package, titulo: 'Estoque de peças',
        texto: 'A peça usada na OS sai do estoque sozinha. Quando chega no mínimo, o sistema avisa antes de faltar.',
        pontos: ['Baixa automática pela OS', 'Alerta de estoque mínimo', 'Histórico de cada movimentação'],
        mock: <EstoqueMock />,
      },
      {
        id: 'comissoes', icon: Percent, titulo: 'Comissões',
        texto: 'Ao concluir a OS, a comissão do mecânico é registrada automaticamente. Você vê o que já foi pago e o que está pendente.',
        pontos: ['Percentual por mecânico', 'Pagas × pendentes', 'Relatório por mecânico'],
        mock: <ComissoesMock />,
      },
      {
        id: 'garantias', icon: BadgeCheck, titulo: 'Garantias',
        texto: 'Cada serviço sai com o prazo de garantia registrado. Quando o cliente volta, você sabe na hora se ainda está valendo.',
        pontos: ['Prazo padrão da oficina (ex.: 90 dias)', 'Vigente ou vencida à vista', 'Ligada ao serviço da OS'],
        mock: <GarantiaMock />,
      },
      {
        id: 'comprovantes', icon: Receipt, titulo: 'Comprovantes de serviço',
        texto: 'Gere o comprovante do serviço feito para entregar ao cliente, com os dados da oficina, do carro e dos itens.',
        pontos: ['Dados da oficina e do veículo', 'Peças e serviços detalhados', 'Pronto para imprimir'],
        mock: <OrcamentoMock />,
      },
      {
        id: 'relatorios', icon: BarChart3, titulo: 'Relatórios',
        texto: 'Faturamento, ticket médio, OS concluídas, estoque e produção por mecânico — e tudo exporta para o Excel.',
        pontos: ['Faturamento por período', 'Produção e comissão por mecânico', 'Exportação para Excel'],
        mock: <RelatorioMock />,
      },
    ],
  },
  {
    id: 'presenca', nome: 'Presença', resumo: 'Sua oficina encontrada por quem precisa de mecânico.',
    recursos: [
      {
        id: 'mini-site', icon: Globe, titulo: 'Mini-site da oficina',
        texto: 'Uma página pública da sua oficina, com serviços, horário, endereço e botão de agendamento — pronta para mandar no WhatsApp e aparecer no Google.',
        pontos: ['Endereço próprio: domecanico.net/oficina/sua-oficina', 'Agendamento direto pela página', 'Prévia bonita quando compartilhada'],
        mock: <MiniSiteMock />,
      },
    ],
  },
]

export default function Funcionalidades() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Funcionalidades"
        title="Tudo que a oficina precisa, do balcão ao pátio."
        lead="Cada tela foi pensada para o dia a dia de oficina: rápido no balcão, simples no celular do mecânico e claro para o cliente."
      />

      <div className="subnav" aria-label="Ir para">
        <div className="wrap">
          {GRUPOS.flatMap(g => g.recursos).map(r => <a key={r.id} href={`#${r.id}`}>{r.titulo.replace(' para o mecânico', '')}</a>)}
        </div>
      </div>

      {GRUPOS.map((g, gi) => (
        <section key={g.id} id={g.id} className="group" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <div className="group-hd">
              <span className="n">0{gi + 1}</span>
              <h2>{g.nome}</h2>
              <p>{g.resumo}</p>
            </div>
            {g.recursos.map((r, i) => (
              <div key={r.id} id={r.id} className={`fx ${i % 2 ? 'rev' : ''}`}>
                <div className="fx-txt">
                  <div className="ic"><r.icon size={20} /></div>
                  <h3>{r.titulo}</h3>
                  <p>{r.texto}</p>
                  <ul className="checks">
                    {r.pontos.map(pt => <li key={pt}><Check size={16} strokeWidth={2.6} /><span>{pt}</span></li>)}
                  </ul>
                </div>
                <div className="fx-mock">{r.mock}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <CTABand title="Teste tudo isso na sua oficina." />
    </SiteLayout>
  )
}
