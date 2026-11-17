import type { ReactNode } from 'react'
import SiteLayout from '../site/SiteLayout'
import { PageHero } from '../site/ui'
import {
  OrcamentoMock, ChecklistMock, AcompanharMock, WhatsMock, FilaMecanicoMock, QuadroPatioMock, ComprovanteMock,
  DiagnosticoMock, AgendaMock, EstoqueMock, ComissoesMock, GarantiaMock, RelatorioMock, MiniSiteMock,
} from '../site/mocks'

// Cada grupo tem a sua composição: Atendimento é a jornada de um carro (o mesmo Civic),
// Pátio vai no fundo graxa com a TV, Gestão é um bento e Presença mostra o celular do cliente.
// Os ids (ordens, checklist, modo-oficina…) são âncoras usadas pela Home: não mudar.

interface Recurso { id: string; titulo: string; texto: string; pontos: string[]; mock: ReactNode }

const ATENDIMENTO: Recurso[] = [
  {
    id: 'checklist', titulo: 'Checklist de entrada',
    texto: 'O Civic chega e você registra o estado dele com fotos e a assinatura do cliente. Acabou a discussão sobre o risco que “não estava ali”.',
    pontos: ['Fotos direto da câmera', 'Cliente assina no celular dele', 'Fica guardado junto da OS'],
    mock: <ChecklistMock />,
  },
  {
    id: 'ordens', titulo: 'Ordem de serviço e orçamento',
    texto: 'Monte o orçamento com peças e serviços separados. O cliente recebe o link, aprova pelo celular e o orçamento vira OS num toque.',
    pontos: ['Peças e serviços somam o valor sozinhos', 'Aprovação pelo link, sem login', 'PDF para imprimir ou mandar'],
    mock: <OrcamentoMock />,
  },
  {
    id: 'acompanhamento', titulo: 'Acompanhamento pelo cliente',
    texto: 'A OS gera um link. O cliente abre no celular e vê o status do carro, as fotos do checklist e o valor, sem baixar app nem criar conta.',
    pontos: ['Status atualiza na hora', 'Menos ligação perguntando “tá pronto?”', 'Imagem profissional da oficina'],
    mock: <AcompanharMock />,
  },
  {
    id: 'whatsapp', titulo: 'WhatsApp automático',
    texto: 'O sistema avisa pelo seu próprio número: carro recebido, orçamento pronto e carro pronto pra retirar.',
    pontos: ['Usa o número da oficina', 'Sem custo por mensagem', 'Textos editáveis'],
    mock: <WhatsMock />,
  },
]

const DIAG_AGENDA: Recurso[] = [
  {
    id: 'diagnosticos', titulo: 'Diagnósticos',
    texto: 'Registre a queixa do cliente e a avaliação técnica item por item. Do diagnóstico sai o orçamento, sem digitar tudo de novo.',
    pontos: ['Queixa sempre em destaque', 'Avaliação vira orçamento', 'Fica no prontuário do carro'],
    mock: <DiagnosticoMock />,
  },
  {
    id: 'agendamentos', titulo: 'Agendamentos',
    texto: 'A agenda da oficina num lugar só. O cliente marca horário pelo mini-site da oficina e recebe a confirmação no WhatsApp.',
    pontos: ['Agenda do dia e da semana', 'Agendamento pelo site da oficina', 'Confirmação automática'],
    mock: <AgendaMock />,
  },
]

const GESTAO: Recurso[] = [
  {
    id: 'estoque', titulo: 'Estoque de peças',
    texto: 'A peça usada na OS sai do estoque sozinha. Quando chega no mínimo, o sistema avisa antes de faltar.',
    pontos: ['Baixa automática pela OS', 'Alerta de estoque mínimo', 'Histórico de movimentação'],
    mock: <EstoqueMock />,
  },
  {
    id: 'comissoes', titulo: 'Comissões',
    texto: 'Ao concluir a OS, a comissão do mecânico é registrada sozinha. Você vê o que já foi pago e o que está pendente.',
    pontos: ['Percentual por mecânico', 'Pagas e pendentes', 'Relatório por mecânico'],
    mock: <ComissoesMock />,
  },
  {
    id: 'garantias', titulo: 'Garantias',
    texto: 'Cada serviço sai com o prazo de garantia registrado. Quando o cliente volta, você sabe na hora se ainda está valendo.',
    pontos: ['Prazo padrão da oficina', 'Vigente ou vencida à vista', 'Ligada ao serviço da OS'],
    mock: <GarantiaMock />,
  },
  {
    id: 'relatorios', titulo: 'Relatórios',
    texto: 'Faturamento, ticket médio, OS concluídas, estoque e produção por mecânico. Tudo exporta para o Excel.',
    pontos: ['Faturamento por período', 'Produção por mecânico', 'Exportação para Excel'],
    mock: <RelatorioMock />,
  },
]

const GRUPOS = [
  { id: 'atendimento', nome: 'Atendimento' },
  { id: 'patio', nome: 'Pátio' },
  { id: 'gestao', nome: 'Gestão' },
  { id: 'presenca', nome: 'Presença' },
]

const Pts = ({ itens }: { itens: string[] }) => <p className="pts">{itens.join(' · ')}</p>

function Card({ r, n, className = '' }: { r: Recurso; n?: string; className?: string }) {
  return (
    <article id={r.id} className={`jcard ${className}`}>
      <div>
        {n && <span className="n">{n}</span>}
        <h3>{r.titulo}</h3>
        <p>{r.texto}</p>
        <Pts itens={r.pontos} />
      </div>
      <div className="vis">{r.mock}</div>
    </article>
  )
}

function GroupHead({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return (
    <div className="group-hd">
      <span className="eyebrow">{n}</span>
      <h2>{titulo}</h2>
      <p>{texto}</p>
    </div>
  )
}

export default function Funcionalidades() {
  return (
    <SiteLayout fechamento={{ titulo: 'Teste tudo isso na sua oficina.', texto: '14 dias com tudo liberado, sem cartão. Abre no navegador do PC ou do celular.' }}>
      <PageHero
        eyebrow="Funcionalidades"
        title="Tudo que a oficina precisa, do balcão ao pátio."
        lead="Rápido no balcão, simples no celular do mecânico e claro para o cliente."
      />

      <nav className="subnav" aria-label="Ir para o grupo">
        <div className="wrap">
          {GRUPOS.map(g => <a key={g.id} href={`#${g.id}`}>{g.nome}</a>)}
        </div>
      </nav>

      {/* ATENDIMENTO: a jornada de um carro */}
      <section id="atendimento">
        <div className="wrap">
          <GroupHead n="01 · Atendimento" titulo="Do carro chegando ao cliente aprovando."
            texto="Acompanhe o Civic do João da entrada à retirada, sem papel e sem telefone tocando." />
          <div className="jgrid">
            {ATENDIMENTO.map((r, i) => <Card key={r.id} r={r} n={`Passo ${i + 1}`} />)}
          </div>
        </div>
      </section>

      {/* PÁTIO: fundo graxa, a TV da oficina */}
      <div className="ground-ink">
        <section id="patio">
          <div className="wrap">
            <GroupHead n="02 · Pátio" titulo="Quem está com a mão no carro, e quem coordena."
              texto="O mecânico trabalha pela fila no celular. O pátio inteiro aparece numa tela só." />
            <div className="pgrid">
              <Card r={{
                id: 'modo-oficina', titulo: 'Modo Oficina para o mecânico',
                texto: 'O mecânico entra pelo celular e já cai na fila dele, em cards grandes, fáceis de tocar até com a mão suja.',
                pontos: ['Atrasadas primeiro', 'Busca por placa', 'Ditado por voz', 'Você decide se ele vê os valores'],
                mock: <FilaMecanicoMock />,
              }} />
              <div id="quadro-patio" className="tvcard">
                <div className="tv"><QuadroPatioMock /></div>
                <div className="tvtxt">
                  <h3>Quadro do Pátio</h3>
                  <p>Todos os carros numa tela, por status ou por mecânico, com o tempo parado em cada etapa e os atrasos em destaque.</p>
                  <p className="pts">Modo TV em tela cheia · Atribui mecânico com um toque · Entrada rápida: placa, queixa, OS</p>
                </div>
              </div>
            </div>
            <div className="jgrid">
              {DIAG_AGENDA.map(r => <Card key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      </div>

      {/* GESTÃO: bento */}
      <section id="gestao">
        <div className="wrap">
          <GroupHead n="03 · Gestão" titulo="Os números da oficina, sem planilha."
            texto="Peça, comissão, garantia e faturamento, tudo saindo da própria OS." />
          <div className="jgrid">
            {GESTAO.map(r => <Card key={r.id} r={r} />)}
            <Card className="wide" r={{
              id: 'comprovantes', titulo: 'Comprovantes de serviço',
              texto: 'Entregue ao cliente o comprovante do serviço feito, com os dados da oficina, do carro, dos itens e da garantia.',
              pontos: ['Dados da oficina e do veículo', 'Peças e serviços detalhados', 'Pronto para imprimir'],
              mock: <ComprovanteMock />,
            }} />
          </div>
        </div>
      </section>

      {/* PRESENÇA: o mini-site no celular de quem procura */}
      <section id="presenca">
        <div className="wrap">
          <div id="mini-site" className="fx" style={{ marginTop: 0 }}>
            <div className="fx-txt">
              <GroupHead n="04 · Presença" titulo="Sua oficina achada por quem precisa de mecânico."
                texto="Uma página pública da oficina, com serviços, horário, endereço e botão de agendamento. Pronta para mandar no WhatsApp e aparecer no Google." />
              <Pts itens={['domecanico.net/oficina/sua-oficina', 'Agendamento pela página', 'Prévia bonita quando compartilhada']} />
            </div>
            <div className="phone mini" aria-hidden="true">
              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-scr"><MiniSiteMock /></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
